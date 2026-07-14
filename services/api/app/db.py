"""SQLite for the demo; the SQLModel schema ports to Postgres unchanged.

On Vercel the filesystem is read-only except /tmp, so the database lives there
and reseeds on cold start — every fresh instance is a pristine demo workspace.
"""
import os

from sqlmodel import Session, SQLModel, create_engine

_default_db = (
    "/tmp/enterprise_mind.db"
    if os.environ.get("VERCEL")
    else os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "enterprise_mind.db")
)
DB_PATH = os.environ.get("EM_DB_PATH", _default_db)
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
