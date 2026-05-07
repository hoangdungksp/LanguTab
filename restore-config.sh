#!/bin/bash
# restore-config.sh — Restore local config after unzipping a fresh version.
#
# Usage:
#   1. Setup .env.local once with OAUTH_CLIENT_ID + EXTENSION_KEY + KV_RATE_LIMITER_ID
#   2. After unzipping version, run: bash restore-config.sh
#
# Reads from .env.local, patches manifest.json + worker/wrangler.toml.

set -e
cd "$(dirname "$0")"

if [ ! -f .env.local ]; then
  echo "❌ .env.local not found. Create it with:"
  echo "  OAUTH_CLIENT_ID=<your-client-id>.apps.googleusercontent.com"
  echo "  EXTENSION_KEY=<base64-public-key>"
  echo "  KV_RATE_LIMITER_ID=<kv-namespace-id>"
  exit 1
fi

source .env.local

echo "🔧 Restoring manifest.json..."
# OAuth client_id
if [ -n "$OAUTH_CLIENT_ID" ]; then
  sed -i.bak "s|REPLACE_WITH_YOUR_CLIENT_ID.apps.googleusercontent.com|$OAUTH_CLIENT_ID|" manifest.json
  rm -f manifest.json.bak
  echo "  ✅ Set client_id"
fi

# Extension key — inserted after "version" line
if [ -n "$EXTENSION_KEY" ]; then
  if grep -q '"key"' manifest.json; then
    # key already exists, replace it
    sed -i.bak "s|\"key\":[[:space:]]*\"[^\"]*\"|\"key\": \"$EXTENSION_KEY\"|" manifest.json
  else
    # insert key after "version" line
    sed -i.bak "/\"version\":/a\\
  \"key\": \"$EXTENSION_KEY\"," manifest.json
  fi
  rm -f manifest.json.bak
  echo "  ✅ Set extension key"
fi

echo ""
echo "🔧 Restoring worker/wrangler.toml..."
if [ -n "$KV_RATE_LIMITER_ID" ]; then
  # Replace placeholder or add KV block
  if grep -q "kv_namespaces" worker/wrangler.toml; then
    # Update existing id
    sed -i.bak "s|id = \"<paste-kv-id-from-step-1>\"|id = \"$KV_RATE_LIMITER_ID\"|" worker/wrangler.toml
    sed -i.bak "s|^# \[\[kv_namespaces\]\]|[[kv_namespaces]]|" worker/wrangler.toml
    sed -i.bak "s|^# binding = \"RATE_LIMITER\"|binding = \"RATE_LIMITER\"|" worker/wrangler.toml
    sed -i.bak "s|^# id = \"<paste-kv-id-from-step-1>\"|id = \"$KV_RATE_LIMITER_ID\"|" worker/wrangler.toml
    rm -f worker/wrangler.toml.bak
    echo "  ✅ Set KV id"
  fi
fi

echo ""
echo "✅ Done. Now run: npm install && npm run build"
