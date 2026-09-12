import importlib
import sys

import pytest


@pytest.fixture
def app_module(monkeypatch):
    monkeypatch.setenv("TTS_SERVICE_TOKEN", "test-secret")
    monkeypatch.setenv("TTS_MAX_CONCURRENT_KOKORO", "2")
    monkeypatch.setenv("TTS_MAX_CONCURRENT_PIPER", "2")
    for name in list(sys.modules):
        if name == "app.main" or name.startswith("app."):
            del sys.modules[name]
    module = importlib.import_module("app.main")
    return module
