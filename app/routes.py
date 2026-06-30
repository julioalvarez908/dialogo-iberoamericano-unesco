import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from threading import Lock
from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr, Field

# En producción, migrar a una base de datos real (PostgreSQL, etc).
DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CONTENIDO_FILE = DATA_DIR / "contenido.json"
INSCRIPCIONES_FILE = DATA_DIR / "inscripciones.json"

_file_lock = Lock()

router = APIRouter()


class Inscripcion(BaseModel):
    nombre: str = Field(..., min_length=2, max_length=120)
    institucion: str = Field(..., min_length=2, max_length=200)
    pais: str = Field(..., min_length=2, max_length=80)
    correo: EmailStr
    rol: Literal[
        "Estudiante",
        "Docente / Investigador",
        "Representante Institucional",
        "Ponente",
        "Asistente General",
    ]


@router.get("/contenido")
async def get_contenido() -> dict:
    if not CONTENIDO_FILE.exists():
        raise HTTPException(status_code=404, detail="contenido.json no encontrado")
    with CONTENIDO_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)


@router.post("/inscripcion")
async def crear_inscripcion(payload: Inscripcion) -> dict:
    registro = {
        "id": str(uuid.uuid4()),
        "fecha": datetime.now(timezone.utc).isoformat(),
        **payload.model_dump(),
    }

    with _file_lock:
        # Demo: persistencia en JSON local. En producción migrar a BD.
        DATA_DIR.mkdir(parents=True, exist_ok=True)
        if INSCRIPCIONES_FILE.exists():
            try:
                with INSCRIPCIONES_FILE.open("r", encoding="utf-8") as f:
                    data = json.load(f)
                if not isinstance(data, list):
                    data = []
            except json.JSONDecodeError:
                data = []
        else:
            data = []

        data.append(registro)

        with INSCRIPCIONES_FILE.open("w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    return {"ok": True, "id": registro["id"]}
