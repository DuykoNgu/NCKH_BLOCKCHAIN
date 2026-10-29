FROM python:3.12-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

ENV DATA_DIR=/data \
    NODE_HOST=0.0.0.0 \
    NODE_PORT=5000 \
    PYTHONUNBUFFERED=1
VOLUME /data
EXPOSE 5000

CMD ["python", "run.py"]
