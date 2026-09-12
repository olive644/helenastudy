from fastapi.testclient import TestClient


def test_health_reports_loaded_flags(app_module):
    with TestClient(app_module.app) as client:
        response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert "kokoro_loaded" in body
    assert "piper_loaded" in body


def test_health_does_not_leak_configuration(app_module):
    with TestClient(app_module.app) as client:
        response = client.get("/health")
    body = response.json()
    assert "test-secret" not in str(body)
    assert "token" not in str(body).lower()


def test_synthesize_requires_secret(app_module):
    with TestClient(app_module.app) as client:
        response = client.post("/synthesize", json={"text": "hello", "rate": 0.86})
    assert response.status_code == 401


def test_synthesize_rejects_wrong_secret(app_module):
    with TestClient(app_module.app) as client:
        response = client.post(
            "/synthesize",
            json={"text": "hello", "rate": 0.86},
            headers={"X-TTS-Secret": "wrong"},
        )
    assert response.status_code == 401


def test_synthesize_returns_audio_on_success(app_module, monkeypatch):
    async def fake_synthesize(text, rate):
        return b"RIFF....WAVEfmt ", "kokoro"

    monkeypatch.setattr(app_module.router, "synthesize", fake_synthesize)
    with TestClient(app_module.app) as client:
        response = client.post(
            "/synthesize",
            json={"text": "hello", "rate": 0.86},
            headers={"X-TTS-Secret": "test-secret"},
        )
    assert response.status_code == 200
    assert response.headers["content-type"] == "audio/wav"
    assert response.headers["x-tts-provider"] == "kokoro"
    assert response.content == b"RIFF....WAVEfmt "


def test_synthesize_returns_503_when_all_providers_fail(app_module, monkeypatch):
    async def fake_synthesize(text, rate):
        raise app_module.AllProvidersFailedError()

    monkeypatch.setattr(app_module.router, "synthesize", fake_synthesize)
    with TestClient(app_module.app) as client:
        response = client.post(
            "/synthesize",
            json={"text": "hello", "rate": 0.86},
            headers={"X-TTS-Secret": "test-secret"},
        )
    assert response.status_code == 503


def test_synthesize_rejects_text_too_long_without_calling_provider(app_module, monkeypatch):
    calls = 0

    async def fake_synthesize(text, rate):
        nonlocal calls
        calls += 1
        return b"audio", "kokoro"

    monkeypatch.setattr(app_module.router, "synthesize", fake_synthesize)
    too_long = "a" * (app_module.settings.max_text_length + 1)
    with TestClient(app_module.app) as client:
        response = client.post(
            "/synthesize",
            json={"text": too_long, "rate": 0.86},
            headers={"X-TTS-Secret": "test-secret"},
        )
    assert response.status_code == 400
    assert calls == 0


def test_synthesize_rejects_empty_text(app_module):
    with TestClient(app_module.app) as client:
        response = client.post(
            "/synthesize",
            json={"text": "", "rate": 0.86},
            headers={"X-TTS-Secret": "test-secret"},
        )
    assert response.status_code == 422


def test_synthesize_rejects_out_of_range_rate(app_module):
    with TestClient(app_module.app) as client:
        response = client.post(
            "/synthesize",
            json={"text": "hello", "rate": 5.0},
            headers={"X-TTS-Secret": "test-secret"},
        )
    assert response.status_code == 422
