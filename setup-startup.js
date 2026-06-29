import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project directory
const projectDir = path.resolve(__dirname);

// Locate Windows Startup directory
const appData = process.env.APPDATA;
if (!appData) {
  console.error('APPDATA environment variable is not defined. Cannot locate Windows Startup directory.');
  process.exit(1);
}

const startupDir = path.join(appData, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const batFileName = 'start_novexis_engine.bat';
const batFilePath = path.join(startupDir, batFileName);

// Bat file content
const batContent = `@echo off
title Novexis B2B Satış Motoru
cd /d "${projectDir}"
:loop
echo [Windows Startup] Novexis Motoru Ateşleniyor...
node app.js
echo [Kritik Uyarı] Node.js uygulaması çöktü veya durdu! 10 saniye içinde yeniden başlatılıyor...
timeout /t 10
goto loop
`;

try {
  // Ensure the startup directory exists (it should, but just in case)
  if (!fs.existsSync(startupDir)) {
    fs.mkdirSync(startupDir, { recursive: true });
  }

  // Write bat file to the Startup folder
  fs.writeFileSync(batFilePath, batContent, 'utf-8');
  console.log(`Startup script successfully created at: ${batFilePath}`);
  console.log(`It points to: ${projectDir}`);
} catch (error) {
  console.error('Failed to create Windows Startup script:', error);
  process.exit(1);
}
