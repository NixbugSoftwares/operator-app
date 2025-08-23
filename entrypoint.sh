#!/bin/sh
echo "window.__ENV__ = { API_BASE_URL: \"${API_BASE_URL}\" };" \
  > /usr/share/nginx/html/env-config.js

exec "$@"
