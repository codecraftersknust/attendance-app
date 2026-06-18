from sqlalchemy import Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from ..db.session import Base


class Programme(Base):
    """Canonical list of programme names.

    ``users.programme``, ``course_programmes.programme`` and
    ``attendance_sessions.programme`` must all reference a name in this
    table, so a typo in one place can't silently break programme matching.
    """

    __tablename__ = "programmes"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
