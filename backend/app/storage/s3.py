import boto3
from botocore.client import Config
from typing import Optional
from .base import Storage


class S3Storage(Storage):
    def __init__(self, bucket: str, region: str, access_key: Optional[str] = None, secret_key: Optional[str] = None, base_path: str = "") -> None:
        self.bucket = bucket
        self.region = region
        self.base_path = base_path.strip("/")
        session_kwargs = {}
        if access_key and secret_key:
            session_kwargs.update(aws_access_key_id=access_key, aws_secret_access_key=secret_key)
        self.s3 = boto3.client("s3", region_name=region, config=Config(signature_version="s3v4"), **session_kwargs)

    def _key(self, path: str) -> str:
        return f"{self.base_path}/{path}" if self.base_path else path

    def save_bytes(self, data: bytes, path: str) -> str:
        key = self._key(path)
        self.s3.put_object(Bucket=self.bucket, Key=key, Body=data, ContentType="application/octet-stream")
        return f"s3://{self.bucket}/{key}"

    def url_for(self, path: str) -> str:
        key = self._key(path)
        return self.s3.generate_presigned_url(
            ClientMethod="get_object",
            Params={"Bucket": self.bucket, "Key": key},
            ExpiresIn=3600,
        )





