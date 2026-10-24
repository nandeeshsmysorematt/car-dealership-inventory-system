VALID_USER = {"email": "buyer@example.com", "password": "StrongPass123"}


def register(client, payload=None):
    return client.post("/api/auth/register", json=payload or VALID_USER)


class TestRegister:
    def test_register_returns_201_and_user_without_password(self, client):
        response = register(client)
        assert response.status_code == 201
        body = response.json()
        assert body["email"] == VALID_USER["email"]
        assert "id" in body
        assert "password" not in body
        assert "hashed_password" not in body

    def test_new_users_get_the_user_role(self, client):
        assert register(client).json()["role"] == "user"

    def test_user_cannot_self_assign_admin_role(self, client):
        payload = {**VALID_USER, "role": "admin"}
        assert register(client, payload).json()["role"] == "user"

    def test_duplicate_email_returns_409(self, client):
        register(client)
        assert register(client).status_code == 409

    def test_invalid_email_returns_422(self, client):
        payload = {**VALID_USER, "email": "not-an-email"}
        assert register(client, payload).status_code == 422

    def test_short_password_returns_422(self, client):
        payload = {**VALID_USER, "password": "123"}
        assert register(client, payload).status_code == 422


class TestLogin:
    def test_login_returns_bearer_token(self, client):
        register(client)
        response = client.post("/api/auth/login", json=VALID_USER)
        assert response.status_code == 200
        body = response.json()
        assert body["token_type"] == "bearer"
        assert body["access_token"]

    def test_wrong_password_returns_401(self, client):
        register(client)
        bad = {**VALID_USER, "password": "WrongPass999"}
        assert client.post("/api/auth/login", json=bad).status_code == 401

    def test_unknown_user_returns_401(self, client):
        response = client.post("/api/auth/login", json=VALID_USER)
        assert response.status_code == 401