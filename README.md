# Personal Nuclei Templates (`@axosecurity/personal-nuclei-templates`)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Nuclei](https://img.shields.io/badge/ProjectDiscovery-Nuclei-blueviolet)](https://github.com/projectdiscovery/nuclei)
[![Author](https://img.shields.io/badge/Author-Axo%20Security-orange)](https://github.com/axosecurity)

A curated collection of specialized, production-tested [Nuclei](https://github.com/projectdiscovery/nuclei) security templates, equipped with a zero-dependency **NPX one-line synchronizer** to keep your local Nuclei templates directory automatically updated across any machine, VPS, or CI/CD runner.

---

## ⚡ Instant One-Line Sync

To install or sync all custom templates into your local Nuclei directory:

### Option 1: Via NPX (Recommended)
```bash
npx -y github:axosecurity/personal-nuclei-templates
```

### Option 2: Via cURL (No Node.js Required)
```bash
curl -fsSL https://raw.githubusercontent.com/axosecurity/personal-nuclei-templates/main/install.sh | bash
```

Both commands automatically locate your `~/nuclei-templates` directory and install the templates under `~/nuclei-templates/custom-axo/` without modifying or overwriting your community templates.

---

## 📋 Included Templates

| Template ID | Protocol | Ports | Description | Tags |
| :--- | :---: | :---: | :--- | :--- |
| `ssh-password-interactive-auth-22` | `javascript` | `22` | Detects interactive password logins (RFC 4252 `password` and PAM `keyboard-interactive`) on port 22. | `ssh,network,axopass,axossh` |
| `ssh-password-interactive-auth-2222` | `javascript` | `2222` | Detects password and keyboard-interactive authentication on port 2222. | `ssh,network,axopass,axossh` |
| `ssh-password-interactive-auth-830` | `javascript` | `830` | Detects password and keyboard-interactive authentication on NETCONF over SSH (port 830). | `ssh,network,axopass,axossh` |
| `ssh-password-interactive-auth-55222` | `javascript` | `55222` | Detects password and keyboard-interactive authentication on high-port SSH (port 55222). | `ssh,network,axopass,axossh` |
| `ssh-server-software-enum` | `javascript` | `22` | Queries raw SSH software version banner and server identification string. | `ssh,enum,axossh` |
| `ssh-version-banner` | `network` | `22` | Direct TCP network probe banner grabber for SSH service identification. | `ssh,network,banner` |

---

## 🚀 Running Scans with Nuclei

Once synchronized, run your scans directly using path or tags:

### 1. Scan a single host or IP:
```bash
nuclei -u 185.255.24.234 -t ~/nuclei-templates/custom-axo/
```

### 2. Scan targets using custom tags:
```bash
nuclei -l targets.txt -tags axossh
```

### 3. Filter specifically for password-enabled SSH servers:
```bash
nuclei -l targets.txt -tags axopass
```

---

## 🛠️ CLI Synchronizer Options

The included `bin/sync.js` utility includes advanced sync and validation features:

| Flag | Description |
| :--- | :--- |
| `-h`, `--help` | Show CLI help message and usage. |
| `-l`, `--list` | List all available templates in the repository with details. |
| `-d`, `--dry-run` | Preview additions and updates without writing to disk. |
| `-v`, `--verify` | Automatically run `nuclei -validate` on all synced templates. |
| `-t`, `--target <path>` | Specify a custom Nuclei templates folder path (e.g. `/opt/nuclei-templates`). |
| `--dest-folder <name>` | Custom destination subfolder name (default: `custom-axo`). |
| `--clean` | Remove previously synchronized templates before installing. |

### CLI Examples:
```bash
# Preview what would be updated:
npx -y github:axosecurity/personal-nuclei-templates --dry-run

# List available templates in the repository:
npx -y github:axosecurity/personal-nuclei-templates --list

# Sync and validate syntax:
npx -y github:axosecurity/personal-nuclei-templates --verify

# Sync to a custom directory:
npx -y github:axosecurity/personal-nuclei-templates --target /data/templates
```

---

## 📂 Repository Structure

```text
personal-nuclei-templates/
├── bin/
│   └── sync.js                               # Zero-dependency Node.js synchronizer CLI
├── templates/
│   ├── ssh/
│   │   ├── ssh-password-interactive-auth.yaml
│   │   ├── ssh-password-interactive-auth-2222.yaml
│   │   ├── ssh-password-interactive-auth-830.yaml
│   │   ├── ssh-password-interactive-auth-55222.yaml
│   │   └── ssh-server-software-enum.yaml
│   └── network/
│       └── ssh-version-banner.yaml
├── install.sh                                # Bash fallback installer for curl one-liners
├── package.json                              # NPX / NPM configuration
├── LICENSE                                   # MIT License
└── README.md                                 # Documentation
```

---

## ➕ Adding New Templates

1. Add your custom YAML template under the `templates/` folder (e.g., `templates/http/` or `templates/ssh/`).
2. Commit and push your changes to GitHub:
   ```bash
   git add templates/
   git commit -m "feat(templates): add new custom template"
   git push origin main
   ```
3. On any machine, re-run:
   ```bash
   npx -y github:axosecurity/personal-nuclei-templates
   ```
   The synchronizer will automatically detect and install the new/modified templates!

---

## 👤 Author

**Axo Security (Solaman)**
- GitHub: [@axosecurity](https://github.com/axosecurity)

## 📄 License

This repository is licensed under the [MIT License](LICENSE).
