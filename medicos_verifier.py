"""
medicos_verifier.py — Verifica registro médico en RETHUS (simulación de API gubernamental).

NOTA: El RETHUS (Registro del Talento Humano en Salud) del Ministerio de Salud de Colombia
requiere autenticación institucional. Esta implementación simula el acceso a la API
RETHUS a la que la empresa tiene acceso institucional directo.

Datos almacenados en: data/medicos.csv
"""

import csv
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
MEDICOS_CSV = DATA_DIR / "medicos.csv"


def _norm(s: str) -> str:
    nfkd = unicodedata.normalize("NFKD", s.upper())
    return " ".join("".join(c for c in nfkd if not unicodedata.combining(c)).split())


def nombre_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, _norm(a), _norm(b)).ratio()


def _load_medicos() -> list[dict]:
    if not MEDICOS_CSV.exists():
        return []
    with open(MEDICOS_CSV, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


def _buscar_medico(numero_registro: str) -> dict:
    """
    Busca un médico en el CSV que simula la API RETHUS.
    Equivalente a: GET /rethus/profesional?registro={numero_registro}
    """
    medicos = _load_medicos()
    # Normalizar el número: quitar RM-, espacios, guiones
    num_norm = numero_registro.strip().upper().lstrip("RM-").lstrip("0")

    for row in medicos:
        reg_csv = row.get("numero_registro", "").strip().upper().lstrip("RM-").lstrip("0")
        if reg_csv == num_norm or row.get("numero_registro", "").strip() == numero_registro.strip():
            estado = row.get("estado", "").strip()
            return {
                "status":            "success",
                "numero_registro":   row.get("numero_registro", "").strip(),
                "nombre_medico":     row.get("nombre_completo", "").strip(),
                "especialidad":      row.get("especialidad", "").strip(),
                "entidad":           row.get("entidad", "").strip(),
                "estado_registro":   estado,
                "vigencia":          row.get("vigencia", "").strip() or None,
                "habilitado":        estado == "ACTIVO",
            }

    return {"status": "no_encontrado"}


def _verificar_medico_completo(
    numero_registro: str,
    nombre_esperado: str = "",
) -> dict:
    """
    Verifica registro médico y opcionalmente confronta el nombre.
    """
    resultado = _buscar_medico(numero_registro)
    verificacion = {
        "registro_valido":  False,
        "medico_habilitado": False,
        "nombre_score":     None,
        "nombre_coincide":  None,
        "alertas":          [],
    }

    if resultado["status"] != "success":
        verificacion["alertas"].append("Número de registro médico no encontrado en RETHUS.")
        return {"rethus": resultado, "verificacion": verificacion}

    verificacion["registro_valido"]  = True
    verificacion["medico_habilitado"] = resultado.get("habilitado", False)

    if not resultado["habilitado"]:
        estado = resultado.get("estado_registro", "DESCONOCIDO")
        verificacion["alertas"].append(
            f"Médico con registro {numero_registro} está {estado} en RETHUS."
        )

    # Verificar nombre si se proporcionó
    if nombre_esperado and resultado.get("nombre_medico"):
        score = nombre_similarity(nombre_esperado, resultado["nombre_medico"])
        verificacion["nombre_score"]   = round(score, 3)
        verificacion["nombre_coincide"] = score >= 0.70
        if not verificacion["nombre_coincide"]:
            verificacion["alertas"].append(
                f"Nombre del médico no coincide (similitud {score:.0%}): "
                f"OCR='{nombre_esperado}' / RETHUS='{resultado['nombre_medico']}'"
            )

    return {"rethus": resultado, "verificacion": verificacion}


async def verificar_medico(numero_registro: str, nombre_esperado: str = "") -> dict:
    """Async wrapper para uso desde FastAPI."""
    import asyncio
    return await asyncio.to_thread(_verificar_medico_completo, numero_registro, nombre_esperado)
