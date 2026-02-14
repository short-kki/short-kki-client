#!/bin/bash

# EAS Build pre-install hook
# google-services.json을 EAS Secret에서 복사

echo "=== EAS Build Pre-Install ==="
echo "Looking for google-services.json..."

# 방법 1: 환경변수에서 파일 경로
if [ -n "$GOOGLE_SERVICES_JSON" ] && [ -f "$GOOGLE_SERVICES_JSON" ]; then
  echo "Found via env var: $GOOGLE_SERVICES_JSON"
  cp "$GOOGLE_SERVICES_JSON" ./google-services.json
  echo "Copied successfully!"
  exit 0
fi

# 방법 2: /secrets/ 경로에서 찾기
if [ -f "/secrets/GOOGLE_SERVICES_JSON" ]; then
  echo "Found at /secrets/GOOGLE_SERVICES_JSON"
  cp /secrets/GOOGLE_SERVICES_JSON ./google-services.json
  echo "Copied successfully!"
  exit 0
fi

# 방법 3: 환경변수에 base64 인코딩된 내용이 있을 경우
if [ -n "$GOOGLE_SERVICES_JSON" ]; then
  echo "Trying to decode from env var..."
  echo "$GOOGLE_SERVICES_JSON" | base64 -d > ./google-services.json 2>/dev/null
  if [ -s ./google-services.json ]; then
    echo "Decoded and saved successfully!"
    exit 0
  fi
fi

echo "Warning: Could not find google-services.json"
ls -la /secrets/ 2>/dev/null || echo "No /secrets/ directory"
echo "GOOGLE_SERVICES_JSON env: ${GOOGLE_SERVICES_JSON:0:50}..."
