"""Canonical programme list helpers.

The ``programmes`` table is the single source of truth for programme names.
Databases created with ``create_all`` (tests, ``init_fresh_db.py``) start
empty, so the list is lazily seeded on first use; existing databases are
seeded by the Alembic migration instead.
"""
from sqlalchemy.orm import Session

from ..models.programme import Programme

# Mirrors web/lib/programmes.ts and mobile/lib/programmes.ts
CANONICAL_PROGRAMMES = [
    "General",
    "Agricultural Engineering",
    "Aerospace Engineering",
    "Biomedical Engineering",
    "Chemical Engineering",
    "Civil Engineering",
    "Computer Engineering",
    "Electrical and Electronics Engineering",
    "Geological Engineering",
    "Geomatic Engineering",
    "Materials Engineering",
    "Mechanical Engineering",
    "Metallurgical Engineering",
    "Petrochemical Engineering",
    "Petroleum Engineering",
    "Telecommunications Engineering",
]


def ensure_programmes_seeded(db: Session) -> None:
    if db.query(Programme.id).first() is None:
        for name in CANONICAL_PROGRAMMES:
            db.add(Programme(name=name))
        db.commit()


def list_programme_names(db: Session) -> list[str]:
    ensure_programmes_seeded(db)
    return [p.name for p in db.query(Programme).order_by(Programme.name).all()]


def is_valid_programme(db: Session, name: str | None) -> bool:
    if not name or not name.strip():
        return False
    ensure_programmes_seeded(db)
    return db.query(Programme.id).filter(Programme.name == name.strip()).first() is not None
