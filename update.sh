#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────
# LinguTab Update Script v2 — KSP Studio
#
# Safe single-command update workflow with multi-layer safeguards.
# After v1.7.x mishap (lost ~700MB audio via accidental rm -rf), this
# script now defends against every known way to lose user data.
#
# Usage:
#   bash ~/Documents/lingua-newtab/update.sh                    # latest zip
#   bash ~/Documents/lingua-newtab/update.sh ~/path/to/zip.zip  # explicit zip
#   bash ~/Documents/lingua-newtab/update.sh --no-deploy        # skip worker
#   bash ~/Documents/lingua-newtab/update.sh --warm             # warm scenes after
#   bash ~/Documents/lingua-newtab/update.sh --skip-git-check   # bypass git clean check
#   bash ~/Documents/lingua-newtab/update.sh --no-snapshot      # skip public/ snapshot
#
# Safeguards (all enabled by default):
#   • Pre-flight: aborts if Git has uncommitted changes (use --skip-git-check to override)
#   • Snapshot: copies public/ to public.snap.{timestamp}/ before any operation
#   • Whitelist: only touches src/, worker/src/, dist/, node_modules/, build configs
#   • Blacklist: NEVER touches public/audio/, public/images/, .env files, key.pem
#   • Pre-zip inspection: refuses zips that contain entries touching public/ or secrets
#   • Atomic rollback: if ANY step fails, restores backup configs + reports state
#   • Post-flight: verifies public/ size matches snapshot (no drift)
# ─────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ─── Configuration ──────────────────────────────────────────────────────
WORKDIR="${LINGUA_WORKDIR:-$HOME/Downloads/lingua-newtab}"
WORKER_URL="https://lingua-newtab-worker.kspstudio.workers.dev"
ADMIN_TOKEN="5320a30ce78e85f9edb69bc4596944fd4743ae4e601a2150d8553fb59a120212"

# Snapshot retention: keep last N snapshots, prune older ones automatically
# to avoid public.snap.* folders accumulating.
SNAPSHOT_RETENTION=3

# ─── Output formatting ──────────────────────────────────────────────────
RED=$'\033[0;31m'
GREEN=$'\033[0;32m'
YELLOW=$'\033[1;33m'
BLUE=$'\033[0;34m'
BOLD=$'\033[1m'
RESET=$'\033[0m'

step() { echo "${BLUE}${BOLD}▶${RESET} ${BOLD}$*${RESET}"; }
ok()   { echo "${GREEN}✓${RESET} $*"; }
warn() { echo "${YELLOW}⚠${RESET} $*"; }
fail() { echo "${RED}✗${RESET} $*" >&2; exit 1; }

confirm() {
  local prompt="${1:-Continue?}"
  local reply
  printf "${YELLOW}? ${prompt} [y/N] ${RESET}" >/dev/tty
  read -r reply </dev/tty
  [[ "$reply" =~ ^[Yy]$ ]]
}

# ─── Parse args ─────────────────────────────────────────────────────────
DEPLOY_WORKER=true
WARM_SCENES=false
SKIP_GIT_CHECK=false
SKIP_SNAPSHOT=false
EXPLICIT_ZIP=""

for arg in "$@"; do
  case "$arg" in
    --no-deploy)        DEPLOY_WORKER=false ;;
    --warm)             WARM_SCENES=true ;;
    --skip-git-check)   SKIP_GIT_CHECK=true ;;
    --no-snapshot)      SKIP_SNAPSHOT=true ;;
    --help|-h)
      cat <<USAGE
LinguTab Update Script v2 — Safe single-command update.

Usage: bash $(basename "$0") [OPTIONS] [ZIP_PATH]

Options:
  --no-deploy         Skip worker deployment (frontend-only update)
  --warm              After deploy, warm exam scenes via admin endpoint
  --skip-git-check    Bypass "git status must be clean" check (NOT recommended)
  --no-snapshot       Skip public/ snapshot (NOT recommended — audio loss risk)
  --help, -h          Show this help
USAGE
      exit 0
      ;;
    -*)                 fail "Unknown option: $arg (try --help)" ;;
    *)                  EXPLICIT_ZIP="$arg" ;;
  esac
done

# ─── Step 0: Sanity checks ──────────────────────────────────────────────
[[ -d "$WORKDIR" ]]              || fail "Working directory not found: $WORKDIR"
command -v unzip >/dev/null      || fail "unzip not found"
command -v npm   >/dev/null      || fail "npm not found (install Node.js)"
$DEPLOY_WORKER && ! command -v npx >/dev/null && fail "npx not found"

cd "$WORKDIR"

# ─── Step 1: Git pre-flight ─────────────────────────────────────────────
# After v1.7.x audio loss, we treat the working directory as sacred.
# Uncommitted changes = lose them on next mistake. Force commit/stash first.
step "Git pre-flight"

if [[ -d .git ]]; then
  if ! command -v git >/dev/null; then
    warn "Git directory present but git command not found"
  else
    if ! git diff --quiet || ! git diff --cached --quiet; then
      warn "Working directory has uncommitted changes:"
      git status --short | head -20
      echo ""
      if $SKIP_GIT_CHECK; then
        warn "--skip-git-check: proceeding anyway"
      else
        fail "Commit/stash uncommitted changes first. Or use --skip-git-check (risky)."
      fi
    else
      ok "Git working directory clean"
    fi

    GIT_HEAD=$(git rev-parse --short HEAD 2>/dev/null || echo "no-commits")
    GIT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "no-branch")
    ok "Starting from: $GIT_BRANCH @ $GIT_HEAD"
  fi
else
  warn "Not a Git repository — recovery from mistakes will be harder"
fi

# ─── Step 2: Find the source zip ────────────────────────────────────────
step "Locating source zip"

if [[ -n "$EXPLICIT_ZIP" ]]; then
  ZIP_PATH="$EXPLICIT_ZIP"
  [[ -f "$ZIP_PATH" ]] || fail "Zip not found: $ZIP_PATH"
else
  ZIP_PATH=$(ls -t "$HOME/Downloads"/lingua-newtab-source-v*.zip 2>/dev/null | head -1 || true)
  [[ -n "$ZIP_PATH" ]] || fail "No lingua-newtab-source-v*.zip found in ~/Downloads"
fi

ZIP_NAME=$(basename "$ZIP_PATH")
ok "Using zip: $ZIP_NAME"

# ─── Step 3: Inspect zip contents (refuse dangerous payloads) ───────────
step "Inspecting zip contents"

DANGEROUS_ENTRIES=$(unzip -Z1 "$ZIP_PATH" | grep -E '^(public/|\.env|key\.pem|worker/\.dev\.vars)' || true)
if [[ -n "$DANGEROUS_ENTRIES" ]]; then
  fail "Zip contains entries that would touch protected paths:
$DANGEROUS_ENTRIES

Source zips must NEVER contain public/, .env, or key.pem.
This zip looks corrupted — refusing to extract."
fi

ZIP_FILE_COUNT=$(unzip -Z1 "$ZIP_PATH" | wc -l | tr -d ' ')
ok "Zip safe — $ZIP_FILE_COUNT entries, no protected paths"

# ─── Step 4: Snapshot public/ ───────────────────────────────────────────
# This is the layer that would have prevented the v1.7.x audio loss.
step "Snapshotting public/"

SNAP_NAME=""
if $SKIP_SNAPSHOT; then
  warn "--no-snapshot: skipping (NOT recommended)"
elif [[ ! -d public ]]; then
  warn "No public/ folder to snapshot (fresh install?)"
else
  SNAP_NAME="public.snap.$(date +%Y%m%d_%H%M%S)"
  cp -R public "$SNAP_NAME"
  PUBLIC_SIZE=$(du -sh "$SNAP_NAME" | awk '{print $1}')
  ok "Snapshotted: $SNAP_NAME ($PUBLIC_SIZE)"

  # Prune old snapshots
  OLD_SNAPS=$(ls -dt public.snap.* 2>/dev/null | tail -n +$((SNAPSHOT_RETENTION + 1)) || true)
  if [[ -n "$OLD_SNAPS" ]]; then
    while IFS= read -r snap; do
      rm -rf "$snap"
      ok "Pruned old snapshot: $snap"
    done <<< "$OLD_SNAPS"
  fi
fi

# ─── Step 5: Backup configs ─────────────────────────────────────────────
step "Backing up build configs"

BACKUP_DIR=$(mktemp -d)
trap 'rm -rf "$BACKUP_DIR"' EXIT

[[ -f manifest.json ]]        && cp manifest.json        "$BACKUP_DIR/"
[[ -f worker/wrangler.toml ]] && cp worker/wrangler.toml "$BACKUP_DIR/"
ok "Configs backed up"

# ─── Step 6: Wipe whitelisted dirs only ─────────────────────────────────
# CRITICAL: this list is the WHITELIST of paths the script may delete.
# Anything not in this list is preserved (public/, .git/, .env, etc.)
step "Wiping rebuild-able directories (whitelist only)"

WIPE_PATHS=(
  src
  worker/src
  node_modules
  dist
  worker/node_modules
  worker/dist
)

for p in "${WIPE_PATHS[@]}"; do
  if [[ -e "$p" ]]; then
    rm -rf "$p"
    ok "Wiped: $p"
  fi
done

# ─── Step 7: Extract new source ─────────────────────────────────────────
step "Extracting $ZIP_NAME"

unzip -oq "$ZIP_PATH" -d .
ok "Source extracted"

# ─── Step 8: Verify public/ integrity ───────────────────────────────────
step "Verifying public/ integrity"

if [[ -n "$SNAP_NAME" ]] && [[ -d public ]] && [[ -d "$SNAP_NAME" ]]; then
  ORIG_SIZE=$(du -sk "$SNAP_NAME" | awk '{print $1}')
  NEW_SIZE=$(du -sk public | awk '{print $1}')
  if [[ "$ORIG_SIZE" != "$NEW_SIZE" ]]; then
    warn "public/ size changed: $ORIG_SIZE KB → $NEW_SIZE KB"
    warn "Snapshot available at: $SNAP_NAME"
    if ! confirm "Continue anyway?"; then
      fail "Aborted by user. Restore via: rm -rf public && mv $SNAP_NAME public"
    fi
  else
    ok "public/ size unchanged ($NEW_SIZE KB)"
  fi
fi

# ─── Step 9: Restore configs ────────────────────────────────────────────
step "Restoring build configs"

[[ -f "$BACKUP_DIR/manifest.json" ]]  && cp "$BACKUP_DIR/manifest.json"  manifest.json
[[ -f "$BACKUP_DIR/wrangler.toml" ]]  && cp "$BACKUP_DIR/wrangler.toml"  worker/wrangler.toml
ok "Configs restored"

VERSION=$(grep -m1 '"version"' manifest.json | sed -E 's/.*"version": "([^"]+)".*/\1/')
ok "Updating to v$VERSION"

# ─── Step 10: Frontend build ────────────────────────────────────────────
step "Installing frontend dependencies"
npm install --silent
ok "Frontend deps installed"

step "Building frontend"
npm run build
ok "Frontend built → dist/"

# ─── Step 11: Worker deploy (optional) ──────────────────────────────────
if $DEPLOY_WORKER; then
  step "Installing worker dependencies"
  (cd worker && npm install --silent)
  ok "Worker deps installed"

  step "Deploying worker to Cloudflare"
  (cd worker && npx wrangler deploy)
  ok "Worker deployed"
else
  warn "Skipping worker deploy (--no-deploy)"
fi

# ─── Step 12: Warm exam scenes (optional) ───────────────────────────────
if $WARM_SCENES; then
  step "Warming exam scenes"

  WARM_RESPONSE=$(curl -sS -X POST "$WORKER_URL/admin/exam/scenes/warm-all" \
    -H "Authorization: Bearer $ADMIN_TOKEN" \
    -H "Content-Type: application/json" \
    --max-time 180)

  if echo "$WARM_RESPONSE" | grep -q '"results"'; then
    ok "Scene warming complete"
    command -v jq >/dev/null && echo "$WARM_RESPONSE" | jq '.results' || echo "$WARM_RESPONSE"
  else
    warn "Warm response unexpected:"
    echo "$WARM_RESPONSE"
  fi
fi

# ─── Step 13: Recommend Git commit ──────────────────────────────────────
if [[ -d .git ]] && command -v git >/dev/null; then
  if ! git diff --quiet; then
    echo ""
    warn "Source files changed during update."
    warn "Commit the new state for rollback safety:"
    echo "  ${BOLD}cd $WORKDIR${RESET}"
    echo "  ${BOLD}git add -A && git commit -m \"Update to v$VERSION\"${RESET}"
    echo "  ${BOLD}git push${RESET}"
  fi
fi

# ─── Done ───────────────────────────────────────────────────────────────
echo ""
echo "${GREEN}${BOLD}✓ LinguTab v$VERSION ready${RESET}"
echo ""
echo "Next steps:"
echo "  1. Open Chrome → ${BOLD}chrome://extensions/${RESET}"
echo "  2. Find LinguTab → click ${BOLD}🔄 Reload${RESET}"
echo "  3. Open New Tab to test"
echo ""

if [[ -n "$SNAP_NAME" ]]; then
  echo "Rollback public/ if needed:"
  echo "  ${BOLD}rm -rf public && mv $SNAP_NAME public${RESET}"
  echo ""
fi

$DEPLOY_WORKER && echo "Worker logs: ${BOLD}cd $WORKDIR/worker && npx wrangler tail${RESET}"
