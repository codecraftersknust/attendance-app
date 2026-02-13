"""
QR Code Rotation Service
Handles automatic QR code rotation for active sessions
"""
import asyncio
import threading
from datetime import timedelta
from typing import Dict, Set
from sqlalchemy.orm import Session
from ..db.session import SessionLocal
from ..models.attendance_session import AttendanceSession
from ..services.utils import generate_session_nonce, utcnow
from ..services.audit import write_audit


class QRRotationService:
    """Service to handle automatic QR code rotation"""
    
    def __init__(self):
        self.active_sessions: Set[int] = set()
        self.rotation_task: asyncio.Task = None
        self.is_running = False
        self._lock = threading.Lock()  # Thread-safe lock for start/stop operations
        self._starting = False  # Flag to prevent concurrent start attempts
    
    async def start_rotation_service(self):
        """Start the background QR rotation service"""
        with self._lock:
            if self.is_running or self._starting:
                return
            
            self._starting = True
        
        try:
            self.is_running = True
            self.rotation_task = asyncio.create_task(self._rotation_loop())
            print("QR Rotation Service started")
        finally:
            with self._lock:
                self._starting = False
    
    async def stop_rotation_service(self):
        """Stop the background QR rotation service"""
        with self._lock:
            if not self.is_running:
                return
        
        self.is_running = False
        if self.rotation_task:
            self.rotation_task.cancel()
            try:
                await self.rotation_task
            except asyncio.CancelledError:
                pass
        print("QR Rotation Service stopped")
    
    def add_session(self, session_id: int):
        """Add a session to automatic rotation (thread-safe)"""
        with self._lock:
            self.active_sessions.add(session_id)
        print(f"Added session {session_id} to QR rotation")
    
    def remove_session(self, session_id: int):
        """Remove a session from automatic rotation (thread-safe)"""
        with self._lock:
            self.active_sessions.discard(session_id)
        print(f"Removed session {session_id} from QR rotation")
    
    def get_active_sessions_count(self) -> int:
        """Get the number of active sessions (thread-safe)"""
        with self._lock:
            return len(self.active_sessions)
    
    def is_service_running_or_starting(self) -> bool:
        """Check if service is running or starting (thread-safe)"""
        with self._lock:
            return self.is_running or self._starting
    
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
        # Get a thread-safe copy of active sessions
        with self._lock:
            active_session_ids = list(self.active_sessions)
        
        if not active_session_ids:
            return
        
        db = SessionLocal()
        try:
            # Get sessions that need QR rotation (expired or about to expire)
            now = utcnow()
            sessions_to_rotate = (
                db.query(AttendanceSession)
                .filter(
                    AttendanceSession.id.in_(active_session_ids),
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
            session.qr_expires_at = utcnow() + timedelta(seconds=30)
            
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
            now = utcnow()
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
    """Add a session to automatic QR rotation (thread-safe)"""
    qr_rotation_service.add_session(session_id)
    # Start service lazily if not already running or starting
    # Use thread-safe check to prevent race conditions with concurrent session creation
    if not qr_rotation_service.is_service_running_or_starting():
        try:
            # Try to get FastAPI's event loop
            loop = asyncio.get_event_loop()
            loop.create_task(qr_rotation_service.start_rotation_service())
        except (RuntimeError, AttributeError):
            # No event loop available - service will start on next async operation
            # This is safe because FastAPI always has an event loop when handling requests
            pass


def remove_session_from_rotation(session_id: int):
    """Remove a session from automatic QR rotation (thread-safe)"""
    qr_rotation_service.remove_session(session_id)
    # Stop service if no sessions remain (thread-safe check)
    if qr_rotation_service.get_active_sessions_count() == 0 and qr_rotation_service.is_running:
        try:
            loop = asyncio.get_event_loop()
            loop.create_task(qr_rotation_service.stop_rotation_service())
        except (RuntimeError, AttributeError):
            # No event loop - will stop on shutdown
            pass


def ensure_qr_valid(session, db: Session, ttl_seconds: int = 30) -> bool:
    """
    Ensure session has a valid QR code (generate if missing, rotate if expired).
    Returns True if QR was generated/rotated, False if already valid.
    This makes QR management fully automatic for the frontend.
    """
    now = utcnow()
    needs_generation = not session.qr_nonce or not session.qr_expires_at
    is_expired = session.qr_expires_at and session.qr_expires_at < now
    
    if needs_generation or is_expired:
        # Generate or rotate QR
        session.qr_nonce = generate_session_nonce()
        session.qr_expires_at = now + timedelta(seconds=ttl_seconds)
        db.commit()
        
        # Ensure session is in rotation
        add_session_to_rotation(session.id)
        
        return True
    return False
