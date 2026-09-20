# ChurchPress API — WeasyPrint-capable image.
# WeasyPrint needs Pango/Cairo system libraries that Render's native Python
# runtime lacks; with this image the styled PDF engine works in production
# instead of falling back to xhtml2pdf's limited CSS support.
FROM python:3.11-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
        libpango-1.0-0 \
        libpangoft2-1.0-0 \
        libpangocairo-1.0-0 \
        libcairo2 \
        libgdk-pixbuf-2.0-0 \
        shared-mime-info \
        fonts-dejavu-core \
        fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 10000
# Render injects PORT; shell form so the variable expands.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-10000}"]
