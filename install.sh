#!/usr/bin/env bash
set -e

# Axo Security - Personal Nuclei Templates Installer
# Installs or synchronizes custom templates into ~/nuclei-templates/custom-axo

REPO_USER="axosecurity"
REPO_NAME="personal-nuclei-templates"
BRANCH="main"

echo "=========================================================="
echo "  Axo Security - Personal Nuclei Templates Installer"
echo "=========================================================="

# Check if node + npx are available
if command -v npx >/dev/null 2>&1; then
    echo "[*] Node.js environment detected. Running via NPX..."
    exec npx -y "github:${REPO_USER}/${REPO_NAME}" "$@"
fi

# Fallback: Git or Curl clone directly
TARGET_DIR="${NUCLEI_TEMPLATES_DIR:-$HOME/nuclei-templates}"
DEST_DIR="${TARGET_DIR}/custom-axo"

echo "[*] NPX not found, using direct installer..."
echo "[*] Target directory: ${DEST_DIR}"

mkdir -p "${DEST_DIR}/ssh" "${DEST_DIR}/network"

TEMPLATES=(
    "ssh/ssh-password-interactive-auth.yaml"
    "ssh/ssh-password-interactive-auth-2222.yaml"
    "ssh/ssh-password-interactive-auth-830.yaml"
    "ssh/ssh-password-interactive-auth-55222.yaml"
    "ssh/ssh-server-software-enum.yaml"
    "network/ssh-version-banner.yaml"
)

BASE_URL="https://raw.githubusercontent.com/${REPO_USER}/${REPO_NAME}/${BRANCH}/templates"

for tmpl in "${TEMPLATES[@]}"; do
    echo "  [+] Downloading ${tmpl}..."
    mkdir -p "$(dirname "${DEST_DIR}/${tmpl}")"
    curl -fsSL "${BASE_URL}/${tmpl}" -o "${DEST_DIR}/${tmpl}"
done

echo ""
echo "[✔] All templates successfully installed into ${DEST_DIR}"
echo "[*] Run with Nuclei:"
echo "    nuclei -t ${DEST_DIR} -u <target>"
echo "    nuclei -tags axossh -u <target>"
