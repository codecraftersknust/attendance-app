from sqlalchemy.orm import Session
from ..models.audit_log import AuditLog


def write_audit(
    db: Session,
    action: str,
    user_id: int | None = None,
    detail: str | None = None,
    *,
    auto_commit: bool = True,
) -> None:
    db.add(AuditLog(user_id=user_id, action=action, detail=detail))
    if auto_commit:
        db.commit()
