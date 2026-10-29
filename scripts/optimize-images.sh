#!/usr/bin/env bash
# =============================================================================
# optimize-images.sh
# Converts PNG → WebP and re-encodes oversized WebP files for web performance.
# Originals are NEVER modified. Output goes to public/optimized/.
# Usage: bash scripts/optimize-images.sh
# =============================================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
WEBP_QUALITY=82           # 80-85: visually lossless for UI/photos
WEBP_QUALITY_REENCODE=78  # Slightly lower for already-webp files that are too big
MAX_WIDTH=2560            # Retina cap (2x at 1280px)
LARGE_THRESHOLD_KB=1000   # Re-encode existing WebP files larger than this (KB)

SRC_ROOT="public"
OUT_ROOT="public/optimized"

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'
BOLD='\033[1m'

log()  { echo -e "${CYAN}[img]${RESET} $*"; }
ok()   { echo -e "${GREEN}[ok ]${RESET} $*"; }
skip() { echo -e "${YELLOW}[skip]${RESET} $*"; }

# ── Helpers ───────────────────────────────────────────────────────────────────
# Get image width using sips (built-in macOS tool)
get_width() { sips -g pixelWidth "$1" 2>/dev/null | awk '/pixelWidth/ {print $2}'; }

# Convert + resize a PNG to WebP
convert_png() {
  local src="$1"
  local rel="${src#$SRC_ROOT/}"                      # relative path from src root
  local dst="${OUT_ROOT}/${rel%.png}.webp"
  local dst_dir; dst_dir=$(dirname "$dst")

  mkdir -p "$dst_dir"

  if [[ -f "$dst" ]]; then
    skip "$(basename "$dst") already exists — skipping"
    return
  fi

  local width; width=$(get_width "$src")
  local resize_flag=""
  if [[ -n "$width" && "$width" -gt "$MAX_WIDTH" ]]; then
    log "$(basename "$src") is ${width}px wide — will resize to ${MAX_WIDTH}px"
    resize_flag="-resize ${MAX_WIDTH} 0"
  fi

  log "PNG → WebP  $(basename "$src")  (q=${WEBP_QUALITY})"
  # shellcheck disable=SC2086
  cwebp -quiet -q "$WEBP_QUALITY" $resize_flag "$src" -o "$dst"

  local src_kb dst_kb
  src_kb=$(du -k "$src" | cut -f1)
  dst_kb=$(du -k "$dst" | cut -f1)
  ok "  $(basename "$dst")  ${src_kb} KB → ${dst_kb} KB  (saved $((src_kb - dst_kb)) KB)"
}

# Re-encode an oversized WebP at a lower quality
reencode_webp() {
  local src="$1"
  local rel="${src#$SRC_ROOT/}"
  local dst="${OUT_ROOT}/${rel}"
  local dst_dir; dst_dir=$(dirname "$dst")

  mkdir -p "$dst_dir"

  if [[ -f "$dst" ]]; then
    skip "$(basename "$dst") already exists — skipping"
    return
  fi

  local src_kb; src_kb=$(du -k "$src" | cut -f1)
  if [[ "$src_kb" -lt "$LARGE_THRESHOLD_KB" ]]; then
    skip "$(basename "$src") is ${src_kb} KB — below threshold, skipping re-encode"
    return
  fi

  local width; width=$(get_width "$src")
  local resize_flag=""
  if [[ -n "$width" && "$width" -gt "$MAX_WIDTH" ]]; then
    log "$(basename "$src") is ${width}px wide — will resize to ${MAX_WIDTH}px"
    resize_flag="-resize ${MAX_WIDTH} 0"
  fi

  log "WebP re-encode  $(basename "$src")  (q=${WEBP_QUALITY_REENCODE})"
  # shellcheck disable=SC2086
  cwebp -quiet -q "$WEBP_QUALITY_REENCODE" $resize_flag "$src" -o "$dst"

  local dst_kb; dst_kb=$(du -k "$dst" | cut -f1)
  ok "  $(basename "$dst")  ${src_kb} KB → ${dst_kb} KB  (saved $((src_kb - dst_kb)) KB)"
}

# ── Main ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  Image Optimization — Portfolio (cwebp v1.6.0)${RESET}"
echo -e "${BOLD}══════════════════════════════════════════════════${RESET}"
echo ""

# --- Pass 1: PNG → WebP -------------------------------------------------------
echo -e "${BOLD}Pass 1 — PNG → WebP conversion${RESET}"
echo "──────────────────────────────"

while IFS= read -r -d '' file; do
  convert_png "$file"
done < <(find "$SRC_ROOT" -name "*.png" -not -path "*/optimized/*" -print0)

echo ""

# --- Pass 2: Re-encode oversized WebP -----------------------------------------
echo -e "${BOLD}Pass 2 — Re-encode oversized WebP files (> ${LARGE_THRESHOLD_KB} KB)${RESET}"
echo "──────────────────────────────────────────────────────────"

while IFS= read -r -d '' file; do
  reencode_webp "$file"
done < <(find "$SRC_ROOT" -name "*.webp" -not -path "*/optimized/*" -print0)

echo ""

# --- Summary ------------------------------------------------------------------
echo -e "${BOLD}══════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  Image optimization complete.${RESET}"
echo -e "  Output directory: ${CYAN}${OUT_ROOT}${RESET}"
echo -e "${BOLD}══════════════════════════════════════════════════${RESET}"
echo ""
