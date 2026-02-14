#!/bin/bash

# EAS Build pre-install hook
# google-services.json을 EAS Secret에서 복사

if [ -n "$GOOGLE_SERVICES_JSON" ]; then
  echo "Copying google-services.json from EAS Secret..."
  cp "$GOOGLE_SERVICES_JSON" ./google-services.json
  echo "google-services.json copied successfully"
else
  echo "Warning: GOOGLE_SERVICES_JSON secret not found"
fi
