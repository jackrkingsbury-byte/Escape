#!/usr/bin/env bash
# Downloads the Kokoro-82M TTS model (int8 ONNX) + voices into ./models
set -euo pipefail
cd "$(dirname "$0")/.."
mkdir -p models
base=https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0
[ -s models/kokoro-v1.0.int8.onnx ] || curl -L -o models/kokoro-v1.0.int8.onnx "$base/kokoro-v1.0.int8.onnx"
[ -s models/voices-v1.0.bin ] || curl -L -o models/voices-v1.0.bin "$base/voices-v1.0.bin"
ls -la models
