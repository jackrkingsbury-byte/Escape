#!/usr/bin/env bash
# Builds chess/android/ChessLens.apk from the web app + the small Java shell, with the plain
# Android SDK tools (no Gradle). Needs: JDK 17+, Android SDK with platforms;android-34 and
# build-tools;34.0.0. Signing key: $CHESSLENS_KEYSTORE (created on first run if missing).
set -euo pipefail
SDK=${ANDROID_HOME:-/opt/android-sdk}
BT=$SDK/build-tools/34.0.0
JAR=$SDK/platforms/android-34/android.jar
HERE=$(cd "$(dirname "$0")" && pwd)
WEB=$(dirname "$HERE")
OUT=$HERE/build
KS=${CHESSLENS_KEYSTORE:-$HOME/.chesslens-release.jks}
VERSION_CODE=${VERSION_CODE:-1}
VERSION_NAME=${VERSION_NAME:-1.0}

rm -rf "$OUT"
mkdir -p "$OUT/assets/www/vendor" "$OUT/assets/www/engine" "$OUT/classes"

# 1. the web app, exactly as published
for f in index.html app.js vision.js engine.js pieces.js model.bin manifest.webmanifest icon.svg icon-192.png icon-512.png; do
  cp "$WEB/$f" "$OUT/assets/www/"
done
cp "$WEB/vendor/chess.js" "$OUT/assets/www/vendor/"
cp "$WEB"/engine/*.js "$WEB"/engine/*.wasm "$OUT/assets/www/engine/"

# 2. resources + manifest
"$BT/aapt2" compile --dir "$HERE/res" -o "$OUT/res.zip"
"$BT/aapt2" link -o "$OUT/base.apk" -I "$JAR" --manifest "$HERE/AndroidManifest.xml" \
  -A "$OUT/assets" "$OUT/res.zip" --min-sdk-version 26 --target-sdk-version 34 \
  --version-code "$VERSION_CODE" --version-name "$VERSION_NAME" -0 wasm -0 bin

# 3. Java → dex
javac -Xlint:-options -source 8 -target 8 -bootclasspath "$JAR:$BT/core-lambda-stubs.jar" -d "$OUT/classes" $(find "$HERE/src" -name '*.java')
"$BT/d8" --min-api 26 --lib "$JAR" --output "$OUT" $(find "$OUT/classes" -name '*.class')
(cd "$OUT" && zip -q base.apk classes.dex)

# 4. align + sign
"$BT/zipalign" -f -p 4 "$OUT/base.apk" "$OUT/aligned.apk"
if [ ! -f "$KS" ]; then
  keytool -genkeypair -keystore "$KS" -storepass chesslens -keypass chesslens -alias chesslens \
    -keyalg RSA -keysize 3072 -validity 10000 -dname "CN=Chess Lens" >/dev/null
fi
"$BT/apksigner" sign --v4-signing-enabled false --ks "$KS" --ks-pass pass:chesslens --key-pass pass:chesslens --out "$HERE/ChessLens.apk" "$OUT/aligned.apk"
"$BT/apksigner" verify "$HERE/ChessLens.apk"
rm -rf "$OUT"
ls -l "$HERE/ChessLens.apk"
