#!/usr/bin/env bash
# Baixa os modelos do Kokoro e do Piper para services/tts/models.
# Os arquivos sao grandes (Kokoro ~325MB, Piper ~63MB) e nao vao pro
# repositorio; rode este script antes de construir a imagem ou rodar os
# testes de integracao reais (tests/test_integration_real_models.py).
set -euo pipefail
cd "$(dirname "$0")/.."

mkdir -p models/piper

echo "Baixando modelo Kokoro (Apache 2.0)..."
curl -sL -o models/kokoro-v1.0.onnx \
  "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
curl -sL -o models/voices-v1.0.bin \
  "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"

echo "Baixando voz Piper en_US-hfc_female-medium (licenca da voz: ver docs/AI_BACKEND.md)..."
curl -sL -o models/piper/en_US-hfc_female-medium.onnx \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx"
curl -sL -o models/piper/en_US-hfc_female-medium.onnx.json \
  "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx.json"

echo "Modelos baixados em services/tts/models."
