import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jwt import PyJWKClient

from app.config import KEYCLOAK_CERTS_URL, KEYCLOAK_CLIENT_ID, KEYCLOAK_ISSUER
from app.database import PostgresClient

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{KEYCLOAK_ISSUER}/protocol/openid-connect/token")
jwks_client = PyJWKClient(KEYCLOAK_CERTS_URL)


def get_current_user_payload(token: str = Depends(oauth2_scheme)) -> dict:
    """Validates the JWT signature and returns the decoded payload"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        signing_key = jwks_client.get_signing_key_from_jwt(token)
        payload = jwt.decode(
            token, signing_key.key, algorithms=["RS256"], audience=KEYCLOAK_CLIENT_ID, options={"verify_iss": False}
        )
        return payload
    except jwt.exceptions.PyJWTError:
        raise credentials_exception


def get_client():
    with PostgresClient() as client:
        yield client


def get_client_instance() -> PostgresClient:
    return PostgresClient()
