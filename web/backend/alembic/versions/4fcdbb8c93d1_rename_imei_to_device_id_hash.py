"""rename_imei_to_device_id_hash

Revision ID: 4fcdbb8c93d1
Revises: 816e665112fe
Create Date: 2025-11-07 12:19:34.768870

"""
from typing import Sequence, Union
import hashlib

from alembic import op
import sqlalchemy as sa
from sqlalchemy import text


# revision identifiers, used by Alembic.
revision: str = '4fcdbb8c93d1'
down_revision: Union[str, None] = '816e665112fe'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def hash_device_id(device_id: str) -> str:
    """Hash device ID using SHA-256"""
    return hashlib.sha256(device_id.encode('utf-8')).hexdigest()


def upgrade() -> None:
    # Get database connection
    conn = op.get_bind()
    
    # Hash existing IMEI values in devices table before renaming
    devices = conn.execute(text("SELECT id, imei FROM devices WHERE imei IS NOT NULL")).fetchall()
    for device_id, imei in devices:
        if imei and imei != "ADMIN_MANUAL":  # Don't hash special markers
            device_id_hash = hash_device_id(imei)
            conn.execute(
                text("UPDATE devices SET imei = :hash WHERE id = :device_id"),
                {"hash": device_id_hash, "device_id": device_id}
            )
    
    # Hash existing IMEI values in attendance_records table before renaming
    records = conn.execute(text("SELECT id, imei FROM attendance_records WHERE imei IS NOT NULL")).fetchall()
    for record_id, imei in records:
        if imei and imei != "ADMIN_MANUAL":  # Don't hash special markers
            device_id_hash = hash_device_id(imei)
            conn.execute(
                text("UPDATE attendance_records SET imei = :hash WHERE id = :record_id"),
                {"hash": device_id_hash, "record_id": record_id}
            )
    
    # Rename columns using batch operations for SQLite compatibility
    with op.batch_alter_table('devices', schema=None) as batch_op:
        # Drop unique index on imei first
        batch_op.drop_index('ix_devices_imei', if_exists=True)
        # Rename column
        batch_op.alter_column('imei', new_column_name='device_id_hash')
        # Recreate unique index with new name
        batch_op.create_index('ix_devices_device_id_hash', ['device_id_hash'], unique=True)
    
    with op.batch_alter_table('attendance_records', schema=None) as batch_op:
        # Rename column (no unique index on this one)
        batch_op.alter_column('imei', new_column_name='device_id_hash')
    
    conn.commit()


def downgrade() -> None:
    # Note: Cannot reverse hash, so downgrade will set device_id_hash to a placeholder
    # This is a one-way migration for security reasons
    conn = op.get_bind()
    
    # Rename columns back
    with op.batch_alter_table('attendance_records', schema=None) as batch_op:
        batch_op.alter_column('device_id_hash', new_column_name='imei')
    
    with op.batch_alter_table('devices', schema=None) as batch_op:
        batch_op.drop_index('ix_devices_device_id_hash', if_exists=True)
        batch_op.alter_column('device_id_hash', new_column_name='imei')
        batch_op.create_index('ix_devices_imei', ['imei'], unique=True)
    
    # Set placeholder values (cannot reverse hash)
    conn.execute(text("UPDATE devices SET imei = 'MIGRATED_FROM_HASH' WHERE imei IS NOT NULL"))
    conn.execute(text("UPDATE attendance_records SET imei = 'MIGRATED_FROM_HASH' WHERE imei IS NOT NULL"))
    
    conn.commit()
