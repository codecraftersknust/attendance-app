"""
Bootstrap a fresh Supabase database.

1. Drops the partial alembic_version table (if any from failed migrations)
2. Creates all tables from SQLAlchemy models
3. Stamps Alembic to the latest revision so future migrations work

Usage:
    python -m scripts.init_supabase
"""
from sqlalchemy import text
from app.db.session import engine
from app.db.base import Base  # noqa: F401  — imports all models

def main():
    print("Connecting to database...")
    with engine.connect() as conn:
        # Drop partial alembic state from failed migration attempt
        conn.execute(text("DROP TABLE IF EXISTS alembic_version"))
        conn.commit()
        print("Cleared alembic_version table.")

    print("Creating all tables from models...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully!")

    # Stamp alembic to latest so future migrations work
    print("Stamping alembic to head revision...")
    from alembic.config import Config
    from alembic import command

    alembic_cfg = Config("alembic.ini")
    command.stamp(alembic_cfg, "head")
    print("Done! Database is ready.")

if __name__ == "__main__":
    main()
