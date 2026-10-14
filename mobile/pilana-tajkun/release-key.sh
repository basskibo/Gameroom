#!/usr/bin/env bash
# One-time: creates Sawmill Tycoon's Android upload key, writes keystore.properties next to this script
# (git-ignored) and stores the key as GitHub Actions secrets, so the "Sawmill Tycoon (Android)" workflow
# builds signed APKs that install over each other. BACK UP the key folder: every update must be
# signed with the same key (with Play App Signing, Google can reset a lost upload key; sideloaded
# installs would need a reinstall).
set -euo pipefail
here="$(cd "$(dirname "$0")" && pwd)"
dir="${1:-$HOME/.config/gameroom}"
store="$dir/sawmill-upload.jks"
alias=upload
mkdir -p "$dir" && chmod 700 "$dir"
[ -e "$store" ] && { echo "$store already exists — not overwriting it."; exit 1; }

pass=$(openssl rand -base64 24 | tr -d '/+=')
keytool -genkeypair -v -keystore "$store" -alias "$alias" -keyalg RSA -keysize 4096 -validity 10000 \
  -storepass "$pass" -keypass "$pass" -dname "CN=Sawmill Tycoon, O=Gameroom, C=RS" >/dev/null
printf 'storeFile=%s\nstorePassword=%s\nkeyAlias=%s\nkeyPassword=%s\n' "$store" "$pass" "$alias" "$pass" > "$here/keystore.properties"
cp "$here/keystore.properties" "$dir/keystore.properties"
chmod 600 "$store" "$here/keystore.properties" "$dir/keystore.properties"

cd "$here"
base64 -w0 "$store" | gh secret set SAWMILL_KEYSTORE_BASE64
printf '%s' "$pass" | gh secret set SAWMILL_KEYSTORE_PASSWORD
printf '%s' "$alias" | gh secret set SAWMILL_KEY_ALIAS
printf '%s' "$pass" | gh secret set SAWMILL_KEY_PASSWORD
echo "Done. Key: $store (back up $dir). Next builds of the workflow are signed with it."
