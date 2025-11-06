"""
QR Code Rotation Service
Handles automatic QR code rotation for active sessions
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, Set
from sqlalchemy.orm import Session
from ..db.session import SessionLocal
from ..models.attendance_session import AttendanceSession
from ..services.utils import generate_session_nonce
from ..services.audit import write_audit


class QRRotationService:
    """Service to handle automatic QR code rotation"""
    
    def __init__(self):
        self.active_sessions: Set[int] = set()
        self.rotation_task: asyncio.Task = None
        self.is_running = False
    
    async def start_rotation_service(self):
        """Start the background QR rotation service"""
        if self.is_running:
            return
        
        self.is_running = True
        self.rotation_task = asyncio.create_task(self._rotation_loop())
        print("QR Rotation Service started")
    
    async def stop_rotation_service(self):
        """Stop the background QR rotation service"""
        self.is_running = False
        if self.rotation_task:
            self.rotation_task.cancel()
            try:
                await self.rotation_task
            except asyncio.CancelledError:
                pass
        print("QR Rotation Service stopped")
    
    def add_session(self, session_id: int):
        """Add a session to automatic rotation"""
        self.active_sessions.add(session_id)
        print(f"Added session {session_id} to QR rotation")
    
    def remove_session(self, session_id: int):
        """Remove a session from automatic rotation"""
        self.active_sessions.discard(session_id)
        print(f"Removed session {session_id} from QR rotation")
    
    async def _rotation_loop(self):
        """Main rotation loop - runs every 30 seconds"""
        while self.is_running:
            try:
                await self._rotate_expired_qrs()
                await self._close_expired_sessions()
                await asyncio.sleep(30)  # Check every 30 seconds
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in QR rotation loop: {e}")
                await asyncio.sleep(30)
    
    async def _rotate_expired_qrs(self):
        """Rotate QR codes for sessions that need it"""
        db = SessionLocal()
        try:
            # Get sessions that need QR rotation (expired or about to expire)
            now = datetime.utcnow()
            sessions_to_rotate = (
                db.query(AttendanceSession)
                .filter(
                    AttendanceSession.id.in_(self.active_sessions),
                    AttendanceSession.is_active == True,
                    AttendanceSession.qr_expires_at < now + timedelta(seconds=10)  # Rotate 10 seconds before expiry
                )
                .all()
            )
            
            for session in sessions_to_rotate:
                await self._rotate_session_qr(db, session)
                
        except Exception as e:
            print(f"Error rotating QR codes: {e}")
        finally:
            db.close()
    
    async def _rotate_session_qr(self, db: Session, session: AttendanceSession):
        """Rotate QR code for a specific session"""
        try:
            # Generate new QR data
            session.qr_nonce = generate_session_nonce()
            session.qr_expires_at = datetime.utcnow() + timedelta(seconds=60)
            
            db.commit()
            
            # Log the rotation
            write_audit(db, "system.auto_rotate_qr", None, f"session_id={session.id}")
            
            print(f"Auto-rotated QR for session {session.id}")
            
        except Exception as e:
            print(f"Error rotating QR for session {session.id}: {e}")
            db.rollback()

    async def _close_expired_sessions(self):
        """Automatically close sessions whose ends_at has passed."""
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            expired = (
                db.query(AttendanceSession)
                .filter(
                    AttendanceSession.is_active == True,
                    AttendanceSession.ends_at != None,
                    AttendanceSession.ends_at < now,
                )
                .all()
            )
            for session in expired:
                session.is_active = False
                session.qr_nonce = None
                session.qr_expires_at = None
                try:
                    db.commit()
                except Exception:
                    db.rollback()
                    continue
                # Stop rotating this session
                self.remove_session(session.id)
                try:
                    write_audit(db, "system.auto_close_session", session.lecturer_id, f"session_id={session.id}")
                except Exception:
                    pass
        finally:
            db.close()


# Global instance
qr_rotation_service = QRRotationService()


async def start_qr_rotation():
    """Start the QR rotation service"""
    await qr_rotation_service.start_rotation_service()


async def stop_qr_rotation():
    """Stop the QR rotation service"""
    await qr_rotation_service.stop_rotation_service()


def add_session_to_rotation(session_id: int):
    """Add a session to automatic QR rotation"""
    qr_rotation_service.add_session(session_id)


def remove_session_from_rotation(session_id: int):
    """Remove a session from automatic QR rotation"""
    qr_rotation_service.remove_session(session_id)
