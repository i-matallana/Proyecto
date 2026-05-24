"""
adres_scraper.py — Verifica afiliación EPS en la base de datos BDUA (simulación de API gubernamental).

NOTA: El portal público de ADRES (www.adres.gov.co/consulte-su-eps) requiere reCAPTCHA
y no es automatizable por seguridad. Esta implementación simula el acceso a la API
gubernamental BDUA a la que la empresa tiene acceso institucional directo.

Datos almacenados en: data/afiliados.csv
"""

import csv
import unicodedata
from difflib import SequenceMatcher
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"
AFILIADOS_CSV = DATA_DIR / "afiliados.csv"

# ── EPS alias table ────────────────────────────────────────────────────────────
EPS_ALIASES: dict[str, list[str]] = {
    "SANITAS":        ["SANITAS", "EPS SANITAS", "KERALTY"],
    "SURA":           ["SURA", "SURAMERICANA", "EPS SURA"],
    "NUEVA EPS":      ["NUEVA EPS", "NUEVA EPS S.A", "NUEVA EPS S.A."],
    "COMPENSAR":      ["COMPENSAR"],
    "SALUD TOTAL":    ["SALUD TOTAL"],
    "FAMISANAR":      ["FAMISANAR"],
    "COOSALUD":       ["COOSALUD"],
    "MEDIMAS":        ["MEDIMAS", "MEDIMÁS"],
    "COOPSANA":       ["COOPSANA"],
    "COMFENALCO":     ["COMFENALCO"],
    "COOMEVA":        ["COOMEVA"],
    "ALIANSALUD":     ["ALIANSALUD"],
    "CAJACOPI":       ["CAJACOPI"],
    "EMSSANAR":       ["EMSSANAR"],
    "ASMET SALUD":    ["ASMET"],
    "CAPITAL SALUD":  ["CAPITAL SALUD"],
    "SALUD MIA":      ["SALUD MIA", "SALUD MÍA"],
    "CONVIDA":        ["CONVIDA"],
    "MALLAMAS":       ["MALLAMAS"],
    "PIJAOS":         ["PIJAOS"],
}


# ── Text utilities ─────────────────────────────────────────────────────────────

def _norm(s: str) -> str:
    nfkd = unicodedata.normalize("NFKD", s.upper())
    return " ".join("".join(c for c in nfkd if not unicodedata.combining(c)).split())


def nombre_similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, _norm(a), _norm(b)).ratio()


def normalizar_eps(eps: str) -> str:
    e = _norm(eps)
    for canonical, aliases in EPS_ALIASES.items():
        if any(_norm(a) in e or e in _norm(a) for a in aliases):
            return canonical
    return e


def eps_match(eps_a: str, eps_b: str) -> bool:
    return normalizar_eps(eps_a) == normalizar_eps(eps_b)


# ── CSV loader ─────────────────────────────────────────────────────────────────

def _load_afiliados() -> list[dict]:
    if not AFILIADOS_CSV.exists():
        return []
    with open(AFILIADOS_CSV, encoding="utf-8-sig", newline="") as f:
        return list(csv.DictReader(f))


# ── Main lookup ────────────────────────────────────────────────────────────────

def _buscar_afiliado(tipo_doc: str, numero_doc: str) -> dict:
    """
    Busca un afiliado en el CSV que simula la API BDUA de ADRES.
    Equivalente a consultar: GET /bdua/afiliado?tipo={tipo_doc}&numero={numero_doc}
    """
    afiliados = _load_afiliados()
    tipo_norm  = _norm(tipo_doc)
    numero_norm = numero_doc.strip()

    for row in afiliados:
        if _norm(row.get("tipo_doc", "")) == tipo_norm and row.get("numero_doc", "").strip() == numero_norm:
            estado = row.get("estado", "").strip()
            eps    = row.get("eps", "").strip()

            if estado == "NO_AFILIADO" or not eps:
                return {"status": "no_encontrado"}

            return {
                "status":            "success",
                "eps_encontrada":    normalizar_eps(eps),
                "estado_afiliacion": estado,
                "nombre_adres":      row.get("nombre_completo", "").strip(),
                "regimen":           row.get("regimen", "").strip(),
                "tipo_afiliado":     row.get("tipo_afiliado", "").strip(),
                "fecha_inicio":      row.get("fecha_inicio", "").strip() or None,
                "fecha_fin":         row.get("fecha_fin", "").strip() or None,
            }

    return {"status": "no_encontrado"}


# ── Public async wrapper ───────────────────────────────────────────────────────

async def consultar_adres(tipo_doc: str, numero_doc: str) -> dict:
    """
    Consulta la base de datos BDUA de ADRES.
    Simula el acceso institucional directo a la API gubernamental.
    """
    import asyncio
    return await asyncio.to_thread(_buscar_afiliado, tipo_doc, numero_doc)
