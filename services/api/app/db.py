"""SQLite for the demo; the SQLModel schema ports to Postgres unchanged."""
import os

from sqlmodel import Session, SQLModel, create_engine

DB_PATH = os.environ.get(
    "EM_DB_PATH",
    os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "enterprise_mind.db"),
)
engine = create_engine(f"sqlite:///{DB_PATH}", connect_args={"check_same_thread": False})


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
