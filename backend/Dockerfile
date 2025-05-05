FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# 環境変数PORTが設定されていればその値を使用し、未設定なら8080をデフォルトとする
ENV PORT=8080

# Cloud Runは環境変数PORTでポートを指定するので、それに合わせる
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]