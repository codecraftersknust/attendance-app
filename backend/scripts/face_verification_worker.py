#!/usr/bin/env python3
"""Dedicated face-verification worker (DeepFace/TensorFlow runs only in this process)."""

import logging
import os
import sys
import time

backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, backend_dir)
os.chdir(backend_dir)

from app.core.config import Settings
from app.db.session import SessionLocal
from app.services.face_verification_jobs import process_one_job

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
)
logger = logging.getLogger("face_worker")


def main() -> None:
    settings = Settings()
    poll_seconds = settings.face_worker_poll_seconds
    logger.info(
        "Face verification worker started (poll=%ss, concurrency=1)",
        poll_seconds,
    )
    while True:
        db = SessionLocal()
        try:
            processed = process_one_job(db)
            if not processed:
                time.sleep(poll_seconds)
        except Exception:
            logger.exception("Worker loop error")
            time.sleep(poll_seconds)
        finally:
            db.close()


if __name__ == "__main__":
    main()
