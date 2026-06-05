FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    HOST=0.0.0.0 \
    PORT=8007 \
    APP_VERSION=v1 \
    STYLE_SLUG=standard \
    AI_PROVIDER=ollama \
    AI_MODEL=llama3.1 \
    OLLAMA_HOST=http://host.docker.internal:11434

# System deps for audio processing
RUN apt-get update && apt-get install -y --no-install-recommends \
      build-essential \
      libsndfile1 \
      ffmpeg \
      curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY simple_main.py ./

EXPOSE 8007

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:${PORT}/healthz || exit 1

CMD ["python", "-m", "uvicorn", "simple_main:app", "--host", "0.0.0.0", "--port", "8007", "--log-level", "info"]


