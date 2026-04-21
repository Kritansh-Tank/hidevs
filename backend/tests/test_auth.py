import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
)


class TestPasswordHashing:
    def test_hash_password_returns_different_from_plain(self):
        plain = "mysecretpassword"
        hashed = hash_password(plain)
        assert hashed != plain

    def test_verify_password_correct(self):
        plain = "mysecretpassword"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_verify_password_wrong(self):
        plain = "mysecretpassword"
        hashed = hash_password(plain)
        assert verify_password("wrongpassword", hashed) is False

    def test_hash_is_unique(self):
        plain = "samepassword"
        hash1 = hash_password(plain)
        hash2 = hash_password(plain)
        # bcrypt generates unique salts
        assert hash1 != hash2
        assert verify_password(plain, hash1) is True
        assert verify_password(plain, hash2) is True


class TestJWT:
    def test_create_and_decode_access_token(self):
        data = {"sub": "user123"}
        token = create_access_token(data)
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "user123"
        assert payload["type"] == "access"

    def test_create_and_decode_refresh_token(self):
        data = {"sub": "user456"}
        token = create_refresh_token(data)
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "user456"
        assert payload["type"] == "refresh"

    def test_decode_invalid_token(self):
        result = decode_token("this.is.not.a.valid.token")
        assert result is None

    def test_decode_empty_token(self):
        result = decode_token("")
        assert result is None

    def test_access_token_different_from_refresh(self):
        data = {"sub": "user789"}
        access = create_access_token(data)
        refresh = create_refresh_token(data)
        assert access != refresh
