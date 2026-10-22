# Multi-stage Dockerfile for Revenue Intelligence Inbox Backend
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code and data
COPY backend/ ./backend/

WORKDIR /app/backend

# Create data directories if needed
RUN mkdir -p data/exports

EXPOSE 8000

ENV PORT=8000
ENV HOST=0.0.0.0

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
