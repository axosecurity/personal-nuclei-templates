#!/usr/bin/env node

/**
 * Axo Security - Personal Nuclei Templates Synchronizer
 * Syncs custom Nuclei templates into your local Nuclei templates directory.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execSync } = require('child_process');

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  dim: '\x1b[2m'
};

function log(msg) {
  console.log(msg);
}

function success(msg) {
  console.log(`${COLORS.green}✔${COLORS.reset} ${msg}`);
}

function info(msg) {
  console.log(`${COLORS.cyan}ℹ${COLORS.reset} ${msg}`);
}

function warn(msg) {
  console.log(`${COLORS.yellow}⚠${COLORS.reset} ${msg}`);
}

function err(msg) {
  console.error(`${COLORS.red}✖${COLORS.reset} ${msg}`);
}

function printBanner() {
  log(`
${COLORS.cyan}${COLORS.bright}  █████╗ ██╗  ██╗ ██████╗     ███████╗███████╗ ██████╗
 ██╔══██╗╚██╗██╔╝██╔═══██╗    ██╔════╝██╔════╝██╔════╝
 ███████║ ╚███╔╝ ██║   ██║    ███████╗█████╗  ██║     
 ██╔══██║ ██╔██╗ ██║   ██║    ╚════██║██╔══╝  ██║     
 ██║  ██║██╔╝ ██╗╚██████╔╝    ███████║███████╗╚██████╗
 ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝     ╚══════╝╚══════╝ ╚═════╝${COLORS.reset}
${COLORS.dim}  Personal Nuclei Templates Synchronizer v1.0.0${COLORS.reset}
`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    target: null,
    destFolder: 'custom-axo',
    dryRun: false,
    list: false,
    verify: false,
    clean: false,
    help: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help' || arg === '-h') {
      options.help = true;
    } else if (arg === '--list' || arg === '-l') {
      options.list = true;
    } else if (arg === '--dry-run' || arg === '-d') {
      options.dryRun = true;
    } else if (arg === '--verify' || arg === '-v') {
      options.verify = true;
    } else if (arg === '--clean') {
      options.clean = true;
    } else if (arg === '--target' || arg === '-t') {
      options.target = args[++i];
    } else if (arg === '--dest-folder') {
      options.destFolder = args[++i];
    }
  }

  return options;
}

function showHelp() {
  printBanner();
  log(`Usage:
  npx github:axosecurity/personal-nuclei-templates [options]

Options:
  -h, --help           Show this help message
  -l, --list           List available custom templates without installing
  -t, --target <path>  Specify custom Nuclei templates root directory (e.g. ~/nuclei-templates)
  --dest-folder <name> Target subfolder name inside nuclei-templates (default: custom-axo)
  -d, --dry-run        Preview synchronization actions without modifying disk
  -v, --verify         Run 'nuclei -validate' on synced templates after installation
  --clean              Remove previously synced templates in the destination folder before copying

Examples:
  # One-line sync (downloads and updates local templates):
  npx github:axosecurity/personal-nuclei-templates

  # Sync and verify template syntax:
  npx github:axosecurity/personal-nuclei-templates --verify

  # Sync into a specific directory:
  npx github:axosecurity/personal-nuclei-templates --target ~/.nuclei-templates
`);
}

function detectNucleiDir(customTarget) {
  if (customTarget) {
    return path.resolve(customTarget.replace(/^~(?=$|\/|\\)/, os.homedir()));
  }

  if (process.env.NUCLEI_TEMPLATES_DIR) {
    return path.resolve(process.env.NUCLEI_TEMPLATES_DIR);
  }

  // Check config file locations
  const configPaths = [
    path.join(os.homedir(), '.config', 'nuclei', '.templates-config.json'),
    path.join(os.homedir(), 'Library', 'Application Support', 'nuclei', '.templates-config.json')
  ];

  for (const cfgPath of configPaths) {
    if (fs.existsSync(cfgPath)) {
      try {
        const raw = fs.readFileSync(cfgPath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed['nuclei-templates-directory'] && fs.existsSync(parsed['nuclei-templates-directory'])) {
          return parsed['nuclei-templates-directory'];
        }
      } catch (_) {}
    }
  }

  // Default fallback
  const defaultDir = path.join(os.homedir(), 'nuclei-templates');
  return defaultDir;
}

function getFilesRecursively(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath));
    } else if (file.endsWith('.yaml') || file.endsWith('.yml')) {
      results.push(fullPath);
    }
  }
  return results;
}

function fileHash(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const buffer = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function parseTemplateMeta(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const idMatch = content.match(/^id:\s*([^\r\n]+)/m);
    const nameMatch = content.match(/name:\s*([^\r\n]+)/m);
    const severityMatch = content.match(/severity:\s*([^\r\n]+)/m);
    return {
      id: idMatch ? idMatch[1].trim() : path.basename(filePath, path.extname(filePath)),
      name: nameMatch ? nameMatch[1].trim() : 'Unnamed',
      severity: severityMatch ? severityMatch[1].trim() : 'info'
    };
  } catch (_) {
    return { id: path.basename(filePath), name: 'Unknown', severity: 'info' };
  }
}

function main() {
  const options = parseArgs();

  if (options.help) {
    showHelp();
    process.exit(0);
  }

  printBanner();

  const sourceTemplatesDir = path.resolve(__dirname, '..', 'templates');

  if (!fs.existsSync(sourceTemplatesDir)) {
    err(`Source templates directory not found at: ${sourceTemplatesDir}`);
    process.exit(1);
  }

  const sourceFiles = getFilesRecursively(sourceTemplatesDir);

  if (sourceFiles.length === 0) {
    warn(`No templates found in source directory.`);
    process.exit(0);
  }

  if (options.list) {
    log(`${COLORS.bright}Available Templates (${sourceFiles.length}):${COLORS.reset}\n`);
    for (const f of sourceFiles) {
      const rel = path.relative(sourceTemplatesDir, f);
      const meta = parseTemplateMeta(f);
      log(`  • ${COLORS.cyan}${meta.id}${COLORS.reset} [${meta.severity}]`);
      log(`    ${COLORS.dim}File:${COLORS.reset} ${rel}`);
      log(`    ${COLORS.dim}Desc:${COLORS.reset} ${meta.name}\n`);
    }
    process.exit(0);
  }

  const nucleiRootDir = detectNucleiDir(options.target);
  const destDir = path.join(nucleiRootDir, options.destFolder);

  info(`Nuclei Root:   ${COLORS.bright}${nucleiRootDir}${COLORS.reset}`);
  info(`Target Folder: ${COLORS.bright}${destDir}${COLORS.reset}`);
  if (options.dryRun) {
    warn(`Running in DRY-RUN mode. No files will be written.`);
  }
  log('');

  if (!options.dryRun && !fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  if (options.clean && !options.dryRun && fs.existsSync(destDir)) {
    warn(`Cleaning existing files in ${destDir}...`);
    fs.rmSync(destDir, { recursive: true, force: true });
    fs.mkdirSync(destDir, { recursive: true });
  }

  let addedCount = 0;
  let updatedCount = 0;
  let unchangedCount = 0;

  for (const srcFile of sourceFiles) {
    const relPath = path.relative(sourceTemplatesDir, srcFile);
    const destFile = path.join(destDir, relPath);
    const destSubDir = path.dirname(destFile);

    const srcHash = fileHash(srcFile);
    const destHash = fileHash(destFile);

    if (!destHash) {
      // New file
      if (!options.dryRun) {
        if (!fs.existsSync(destSubDir)) fs.mkdirSync(destSubDir, { recursive: true });
        fs.copyFileSync(srcFile, destFile);
      }
      log(`  ${COLORS.green}[+] ADDED${COLORS.reset}     ${relPath}`);
      addedCount++;
    } else if (srcHash !== destHash) {
      // Modified file
      if (!options.dryRun) {
        fs.copyFileSync(srcFile, destFile);
      }
      log(`  ${COLORS.yellow}[*] UPDATED${COLORS.reset}   ${relPath}`);
      updatedCount++;
    } else {
      // Identical
      log(`  ${COLORS.dim}[=] UNCHANGED${COLORS.reset} ${relPath}`);
      unchangedCount++;
    }
  }

  log('');
  success(`Sync completed! Added: ${addedCount}, Updated: ${updatedCount}, Unchanged: ${unchangedCount}`);
  log(`Templates are installed at: ${COLORS.bright}${destDir}${COLORS.reset}`);
  log('');
  log(`${COLORS.cyan}Usage with Nuclei:${COLORS.reset}`);
  log(`  nuclei -t ${path.join(destDir, '')} -u <target>`);
  log(`  nuclei -tags axossh -u <target>\n`);

  if (options.verify) {
    info(`Validating synchronized templates with nuclei...`);
    try {
      execSync(`nuclei -t "${destDir}" -validate -duc`, { stdio: 'inherit' });
      success(`All templates passed syntax validation!`);
    } catch (e) {
      warn(`Nuclei validation finished with warnings or nuclei CLI is not in PATH.`);
    }
  }
}

main();
