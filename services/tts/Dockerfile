# Servico de TTS do HelenaStudy: Kokoro como provedor principal, Piper como
# reserva. Roda em container proprio, nunca exposto direto ao navegador; a
# funcao /api/speech da Vercel fala com ele por HTTP interno autenticado.
FROM python:3.12-slim AS base

RUN apt-get update \
    && apt-get install -y --no-install-recommends espeak-ng curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /srv

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY app ./app
COPY scripts/download-voice-models.sh ./scripts/download-voice-models.sh
RUN chmod +x scripts/download-voice-models.sh && ./scripts/download-voice-models.sh

ENV PYTHONUNBUFFERED=1
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s \
    CMD curl -f http://localhost:8080/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080"]
