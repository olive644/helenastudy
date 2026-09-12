#!/usr/bin/env bash
# Baixa os modelos do Kokoro e do Piper para services/tts/models.
# Os arquivos sao grandes (Kokoro ~325MB, Piper ~63MB) e nao vao pro
# repositorio; rode este script antes de construir a imagem ou rodar os
# testes de integracao reais (tests/test_integration_real_models.py).
#
# Defina SKIP_PIPER=1 pra baixar so o Kokoro — usado no build pro tier
# gratuito do Railway, onde o limite de RAM (0.5GB) nao sobra espaco pros
# dois motores juntos. O servico continua funcionando normalmente sem o
# Piper: ele so vira "nao carregado" no /health, e o roteador de fallback
# ja cai direto pra voz do navegador quando o Kokoro falha.
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Baixando modelo Kokoro (Apache 2.0)..."
mkdir -p models
curl -sL -o models/kokoro-v1.0.onnx \
  "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx"
curl -sL -o models/voices-v1.0.bin \
  "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin"

if [ "${SKIP_PIPER:-0}" = "1" ]; then
  echo "SKIP_PIPER=1: pulando o download do Piper."
else
  echo "Baixando voz Piper en_US-hfc_female-medium (licenca da voz: ver docs/AI_BACKEND.md)..."
  mkdir -p models/piper
  curl -sL -o models/piper/en_US-hfc_female-medium.onnx \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx"
  curl -sL -o models/piper/en_US-hfc_female-medium.onnx.json \
    "https://huggingface.co/rhasspy/piper-voices/resolve/main/en/en_US/hfc_female/medium/en_US-hfc_female-medium.onnx.json"
fi

echo "Modelos baixados em services/tts/models."
