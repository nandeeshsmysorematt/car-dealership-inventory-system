ALLOWED_ORIGIN = "http://localhost:5173"


def preflight(client, origin):
    return client.options(
        "/api/vehicles",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "authorization",
        },
    )


def test_frontend_origin_is_allowed(client):
    response = preflight(client, ALLOWED_ORIGIN)
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == ALLOWED_ORIGIN


def test_authorization_header_is_allowed(client):
    response = preflight(client, ALLOWED_ORIGIN)
    assert "authorization" in response.headers["access-control-allow-headers"].lower()


def test_unknown_origin_is_not_allowed(client):
    response = preflight(client, "http://evil.example.com")
    assert "access-control-allow-origin" not in response.headers


def test_extra_origins_come_from_environment(monkeypatch):
    from app.main import parse_cors_origins

    monkeypatch.setenv("CORS_ORIGINS", "https://shop.netlify.app, https://other.app")
    assert parse_cors_origins() == ["https://shop.netlify.app", "https://other.app"]


def test_default_origins_cover_local_vite_dev_server(monkeypatch):
    from app.main import parse_cors_origins

    monkeypatch.delenv("CORS_ORIGINS", raising=False)
    assert "http://localhost:5173" in parse_cors_origins()