import asyncio
import base64
import io
import json
import os
import sys
import time
from pathlib import Path

import fitz  # pymupdf
import httpx
from dotenv import load_dotenv
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles

load_dotenv()

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

# ── Configuración ──────────────────────────────────────────────────────────────
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
RESULTADOS_DIR = Path("ocr_resultados")
RESULTADOS_DIR.mkdir(exist_ok=True)

MODELS_CATALOG: dict[str, dict] = {
    "google/gemini-2.0-flash-001": {
        "label": "Gemini 2.0 Flash",
        "provider": "Google",
        "cost_label": "$",
        "speed_label": "~4-6s",
        "recommended": True,
        "description": "Mejor balance velocidad/calidad. Excelente en español.",
    },
    "openai/gpt-4o-mini": {
        "label": "GPT-4o Mini",
        "provider": "OpenAI",
        "cost_label": "$",
        "speed_label": "~5-8s",
        "recommended": False,
        "description": "Muy bueno en extracción estructurada y JSON limpio.",
    },
    "baidu/qianfan-ocr-fast": {
        "label": "Qianfan OCR Fast",
        "provider": "Baidu",
        "cost_label": "$$",
        "speed_label": "~6-10s",
        "recommended": False,
        "description": "Más preciso en documentos de baja calidad de escaneo.",
    },
    "anthropic/claude-3-haiku-20240307": {
        "label": "Claude 3 Haiku",
        "provider": "Anthropic",
        "cost_label": "$",
        "speed_label": "~4-7s",
        "recommended": False,
        "description": "Rápido y sigue instrucciones con alta precisión.",
    },
    "openai/gpt-4o": {
        "label": "GPT-4o",
        "provider": "OpenAI",
        "cost_label": "$$$",
        "speed_label": "~8-15s",
        "recommended": False,
        "description": "Máxima precisión. Mayor costo por consulta.",
    },
    "meta-llama/llama-3.2-11b-vision-instruct:free": {
        "label": "Llama 3.2 Vision",
        "provider": "Meta",
        "cost_label": "Gratis",
        "speed_label": "Variable",
        "recommended": False,
        "description": "Gratuito. Puede fallar con documentos en español o baja calidad.",
    },
}

PROMPT_OCR = """Eres un sistema OCR especializado en certificados de incapacidad médica colombianos.

Extrae TODOS los datos visibles y devuelve ÚNICAMENTE un objeto JSON válido, sin bloques markdown ni explicaciones:

{
  "numero_incapacidad": "string o null",
  "tipo": "ENFERMEDAD_GENERAL | ACCIDENTE_TRABAJO | ENFERMEDAD_LABORAL | MATERNIDAD | null",
  "origen": "COMUN | LABORAL | null",
  "fecha_expedicion": "YYYY-MM-DD o null",
  "fecha_atencion": "YYYY-MM-DD o null",
  "fecha_inicio": "YYYY-MM-DD o null",
  "fecha_fin": "YYYY-MM-DD o null",
  "dias": numero_entero_o_null,
  "diagnostico_codigo": "código CIE-10 o null",
  "diagnostico_descripcion": "descripción diagnóstico o null",
  "eps_detectada": "nombre EPS o null",
  "medico_nombre": "nombre completo médico o null",
  "medico_registro": "número registro médico o null",
  "especialidad_medico": "especialidad o null",
  "ips": "nombre institución prestadora o null",
  "paciente_nombre": "nombre completo paciente o null",
  "paciente_tipo_doc": "CC | TI | CE | PA | null",
  "paciente_documento": "número documento o null",
  "es_prorroga": false,
  "numero_incapacidad_previa": "string o null",
  "confidence": {
    "overall": 0.0,
    "eps_detectada": 0.0,
    "diagnostico_codigo": 0.0,
    "medico_nombre": 0.0,
    "fechas": 0.0,
    "paciente": 0.0
  },
  "calidad_documento": "ALTA | MEDIA | BAJA",
  "notas": "observaciones sobre legibilidad o null"
}

Reglas: si un campo no es visible usa null. No inventes datos."""


# ── CIE-10 Lookup ──────────────────────────────────────────────────────────────
CIE10_CACHE: dict[str, str | None] = {}
NOTASALUD_CIE10_URL = "https://notasalud.com/buscar/cie-10"


async def lookup_cie10(codigo: str) -> str | None:
    """Consulta descripción oficial de un código CIE-10 en español vía NotaSalud."""
    key = codigo.upper().strip().replace(".", "")
    if key in CIE10_CACHE:
        return CIE10_CACHE[key]
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(NOTASALUD_CIE10_URL, params={"q": codigo, "limit": 5})
            resp.raise_for_status()
            # {"query": "...", "total": N, "results": [{"codigo": "...", "nombre": "...", ...}]}
            results: list[dict] = resp.json().get("results") or []
            for item in results:
                if item["codigo"].upper().replace(".", "") == key:
                    CIE10_CACHE[key] = item["nombre"]
                    return item["nombre"]
            if results:
                CIE10_CACHE[key] = results[0]["nombre"]
                return results[0]["nombre"]
    except Exception:
        pass
    CIE10_CACHE[key] = None
    return None


# ── Helpers OCR ────────────────────────────────────────────────────────────────

def pdf_bytes_to_images_b64(pdf_bytes: bytes, dpi: int = 200) -> list[str]:
    doc = fitz.open(stream=pdf_bytes, filetype="pdf")
    mat = fitz.Matrix(dpi / 72, dpi / 72)
    imgs = []
    for page in doc:
        pix = page.get_pixmap(matrix=mat)
        imgs.append(base64.b64encode(pix.tobytes("png")).decode())
    doc.close()
    return imgs


def parse_model_response(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        lines = text.splitlines()
        start = 1
        end = len(lines) - 1 if lines[-1].strip() == "```" else len(lines)
        text = "\n".join(lines[start:end])
    return json.loads(text.strip())


async def call_model(
    client: httpx.AsyncClient,
    images_b64: list[str],
    model_id: str,
    filename: str,
) -> dict:
    content = [
        {"type": "text", "text": f"Documento: {filename}. Páginas adjuntas: {len(images_b64)}."}
    ]
    for b64 in images_b64:
        content.append({"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}})

    t0 = time.time()
    resp = await client.post(
        OPENROUTER_URL,
        json={
            "model": model_id,
            "messages": [
                {"role": "system", "content": PROMPT_OCR},
                {"role": "user", "content": content},
            ],
            "temperature": 0.1,
            "max_tokens": 1500,
        },
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://incapacidades.ai",
            "X-Title": "Incapacidades OCR Comparador",
        },
    )
    resp.raise_for_status()

    elapsed = round(time.time() - t0, 2)
    raw_text = resp.json()["choices"][0]["message"]["content"]
    result = parse_model_response(raw_text)
    result["_model_id"] = model_id
    result["_tiempo_seg"] = elapsed
    result["_paginas"] = len(images_b64)
    result["_archivo"] = filename
    return result


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Incapacidades OCR API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

STATIC_DIR = Path("static")
STATIC_DIR.mkdir(exist_ok=True)
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


# ── Rutas ──────────────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def root():
    html = (STATIC_DIR / "index.html").read_text(encoding="utf-8")
    return HTMLResponse(html)


@app.get("/api/models")
async def get_models():
    """Lista todos los modelos disponibles con sus metadatos."""
    return {"models": MODELS_CATALOG}


@app.post("/api/ocr/extract")
async def extract_single(
    file: UploadFile = File(..., description="PDF de incapacidad médica"),
    model: str = Form(default="google/gemini-2.0-flash-001"),
):
    """Extrae datos de un PDF usando un modelo específico."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Solo se aceptan archivos PDF.")
    if model not in MODELS_CATALOG:
        raise HTTPException(400, f"Modelo no reconocido: {model}")

    pdf_bytes = await file.read()
    images = pdf_bytes_to_images_b64(pdf_bytes)

    try:
        async with httpx.AsyncClient(timeout=90.0) as client:
            result = await call_model(client, images, model, file.filename)
    except httpx.HTTPStatusError as e:
        raise HTTPException(502, f"Error del modelo: {e.response.status_code} — {e.response.text[:200]}")
    except json.JSONDecodeError as e:
        raise HTTPException(502, f"El modelo no devolvió JSON válido: {e}")

    return result


@app.post("/api/ocr/compare")
async def compare_models(
    file: UploadFile = File(..., description="PDF de incapacidad médica"),
    models: str = Form(..., description='Array JSON de IDs de modelos: ["model1","model2"]'),
):
    """Compara extracción de un PDF usando múltiples modelos en paralelo."""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(400, "Solo se aceptan archivos PDF.")

    try:
        model_list: list[str] = json.loads(models)
    except Exception:
        raise HTTPException(400, "El campo 'models' debe ser un array JSON válido.")

    invalid = [m for m in model_list if m not in MODELS_CATALOG]
    if invalid:
        raise HTTPException(400, f"Modelos no reconocidos: {invalid}")
    if not model_list:
        raise HTTPException(400, "Selecciona al menos 1 modelo.")

    pdf_bytes = await file.read()
    images = pdf_bytes_to_images_b64(pdf_bytes)

    t_global = time.time()

    async with httpx.AsyncClient(timeout=120.0) as client:
        tasks = [call_model(client, images, m, file.filename) for m in model_list]
        raw = await asyncio.gather(*tasks, return_exceptions=True)

    resultados: dict[str, dict] = {}
    for model_id, r in zip(model_list, raw):
        if isinstance(r, Exception):
            resultados[model_id] = {
                "_model_id": model_id,
                "_error": str(r),
                "_archivo": file.filename,
            }
        else:
            resultados[model_id] = r

    return {
        "archivo": file.filename,
        "paginas": len(images),
        "tiempo_total_seg": round(time.time() - t_global, 2),
        "modelos": model_list,
        "resultados": resultados,
    }


@app.get("/api/results")
async def list_results():
    """Lista los últimos resultados guardados en disco."""
    files = sorted(
        RESULTADOS_DIR.rglob("*_ocr.json"),
        key=lambda p: p.stat().st_mtime,
        reverse=True,
    )
    return [
        {
            "nombre": f.name,
            "eps": f.parent.name,
            "ruta": str(f.relative_to(RESULTADOS_DIR)),
        }
        for f in files[:50]
    ]


@app.get("/api/health")
async def health():
    return {"status": "ok", "modelos_disponibles": len(MODELS_CATALOG)}


@app.get("/api/cie10/{codigo}")
async def get_cie10(codigo: str):
    """Busca la descripción oficial de un código CIE-10 (NIH ICD-10-CM, sin autenticación)."""
    desc = await lookup_cie10(codigo)
    if desc is None:
        raise HTTPException(404, f"Código CIE-10 '{codigo}' no encontrado.")
    return {"codigo": codigo.upper(), "descripcion": desc, "fuente": "NIH ICD-10-CM"}
