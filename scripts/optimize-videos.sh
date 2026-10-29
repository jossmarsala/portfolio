#!/usr/bin/env bash
# =============================================================================
# optimize-videos.sh
# Optimizes MP4 videos for web delivery using FFmpeg.
# - H.264 (libx264) at CRF 26, faststart, yuv420p — max 1920px wide
# - WebM (libvpx-vp9) at CRF 30 — modern browser alternative (~40% smaller)
# - Audio is stripped (portfolio hero/loop videos are silent UI demos)
# Originals are NEVER modified. Output goes to public/optimized/.
# Usage: bash scripts/optimize-videos.sh
# Requires: ffmpeg (brew install ffmpeg)
# =============================================================================

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
H264_CRF=26          # 23 = default, 26-28 = good quality/size for web
VP9_CRF=33           # VP9 CRF (0-63, lower = better quality)
VP9_BITRATE=0        # 0 = constrained quality mode (pairs with CRF)
MAX_WIDTH=1920       # Cap resolution — portfolio videos don't need more
STRIP_AUDIO=true     # Hero/loop videos are muted; strip audio track entirely

SRC_ROOT="public"
OUT_ROOT="public/optimized"

# ── Colours ───────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'
BOLD='\033[1m'

log()  { echo -e "${CYAN}[vid]${RESET} $*"; }
ok()   { echo -e "${GREEN}[ok ]${RESET} $*"; }
skip() { echo -e "${YELLOW}[skip]${RESET} $*"; }
err()  { echo -e "\033[0;31m[err]\033[0m $*" >&2; }

# ── Helpers ───────────────────────────────────────────────────────────────────
human_size() { du -sh "$1" 2>/dev/null | cut -f1; }

encode_h264() {
  local src="$1"
  local rel="${src#$SRC_ROOT/}"
  local dst="${OUT_ROOT}/${rel}"
  local dst_dir; dst_dir=$(dirname "$dst")

  mkdir -p "$dst_dir"

  if [[ -f "$dst" ]]; then
    skip "$(basename "$dst") (H.264) already exists — skipping"
    return
  fi

  local audio_flag="-an"
  [[ "$STRIP_AUDIO" != "true" ]] && audio_flag="-c:a aac -b:a 128k"

  log "H.264 encode  $(basename "$src")  →  $(basename "$dst")"
  ffmpeg -nostdin -y -i "$src" \
    -vf "scale='min(${MAX_WIDTH},iw)':-2" \
    -c:v libx264 \
    -crf "$H264_CRF" \
    -preset slow \
    -profile:v high \
    -pix_fmt yuv420p \
    -movflags +faststart \
    $audio_flag \
    -loglevel error \
    "$dst"

  local src_size dst_size
  src_size=$(human_size "$src")
  dst_size=$(human_size "$dst")
  ok "  $(basename "$dst")  ${src_size} → ${dst_size}"
}

encode_vp9() {
  local src="$1"
  local rel="${src#$SRC_ROOT/}"
  local webm_rel="${rel%.mp4}.webm"
  local dst="${OUT_ROOT}/${webm_rel}"
  local dst_dir; dst_dir=$(dirname "$dst")

  mkdir -p "$dst_dir"

  if [[ -f "$dst" ]]; then
    skip "$(basename "$dst") (VP9/WebM) already exists — skipping"
    return
  fi

  local audio_flag="-an"
  [[ "$STRIP_AUDIO" != "true" ]] && audio_flag="-c:a libopus -b:a 96k"

  log "VP9/WebM encode  $(basename "$src")  →  $(basename "$dst")"
  # VP9 constrained quality mode
  ffmpeg -nostdin -y -i "$src" \
    -vf "scale='min(${MAX_WIDTH},iw)':-2" \
    -c:v libvpx-vp9 \
    -crf "$VP9_CRF" \
    -b:v "$VP9_BITRATE" \
    -deadline good \
    -cpu-used 2 \
    $audio_flag \
    -loglevel error \
    "$dst"

  local src_size dst_size
  src_size=$(human_size "$src")
  dst_size=$(human_size "$dst")
  ok "  $(basename "$dst")  ${src_size} → ${dst_size}"
}

# ── Main ──────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}══════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  Video Optimization — Portfolio (FFmpeg)${RESET}"
echo -e "${BOLD}══════════════════════════════════════════════════${RESET}"
echo ""

if ! command -v ffmpeg &>/dev/null; then
  err "FFmpeg not found. Install with: brew install ffmpeg"
  exit 1
fi

echo "FFmpeg: $(ffmpeg -version 2>&1 | head -1)"
echo ""

# --- MP4 files: encode both H.264 and VP9/WebM --------------------------------
echo -e "${BOLD}Encoding MP4 → H.264 (web-optimised)${RESET}"
echo "──────────────────────────────────────"

while IFS= read -r -d '' file; do
  encode_h264 "$file"
done < <(find "$SRC_ROOT" -name "*.mp4" -not -path "*/optimized/*" -print0)

echo ""
echo -e "${BOLD}Encoding MP4 → VP9/WebM (modern browser fallback)${RESET}"
echo "──────────────────────────────────────────────────"

while IFS= read -r -d '' file; do
  encode_vp9 "$file"
done < <(find "$SRC_ROOT" -name "*.mp4" -not -path "*/optimized/*" -print0)

echo ""

# --- Summary ------------------------------------------------------------------
echo -e "${BOLD}══════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  Video optimization complete.${RESET}"
echo -e "  Output directory: ${CYAN}${OUT_ROOT}${RESET}"
echo -e "${BOLD}══════════════════════════════════════════════════${RESET}"
echo ""
