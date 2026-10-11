# ==============================================================================
# FloodSafe — Unified Multi-Stage Production Docker Container
# Combines React/Vite Frontend + FastAPI/Cedar Backend in a Single Service
# Optimized for 1-Click Free Deployment on Render, Railway, or Fly.io
# ==============================================================================

# ----------------------------------------------------
# Stage 1: Build Frontend (Vite + React + TypeScript)
# ----------------------------------------------------
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ----------------------------------------------------
# Stage 2: Python Backend (FastAPI + Cedar + Uvicorn)
# ----------------------------------------------------
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python backend dependencies
COPY backend/requirements.txt backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy project backend source, policies, and configs
COPY backend/ backend/
COPY policies/ policies/
COPY pyproject.toml .

# Copy compiled frontend static build from Stage 1 into frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Render and cloud platforms dynamically inject the $PORT environment variable
ENV PORT=8000
EXPOSE 8000

# Start Uvicorn bound to 0.0.0.0 and dynamic port
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
