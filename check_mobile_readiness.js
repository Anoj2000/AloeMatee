#!/usr/bin/env node

/**
 * Mobile App Readiness Checklist
 * Quick verification that everything is set up correctly
 */

const fs = require('fs');
const path = require('path');

const COLORS = {
  GREEN: '\x1b[32m',
  RED: '\x1b[31m',
  YELLOW: '\x1b[33m',
  CYAN: '\x1b[36m',
  RESET: '\x1b[0m',
  BOLD: '\x1b[1m',
};

function check(condition, message) {
  if (condition) {
    console.log(`${COLORS.GREEN}✓${COLORS.RESET} ${message}`);
    return true;
  } else {
    console.log(`${COLORS.RED}✗${COLORS.RESET} ${message}`);
    return false;
  }
}

function info(message) {
  console.log(`${COLORS.CYAN}ℹ${COLORS.RESET} ${message}`);
}

console.log(`\n${COLORS.BOLD}${COLORS.CYAN}Mobile App Readiness Checklist${COLORS.RESET}\n`);

let allPassed = true;

// Check 1: Mobile directory exists
const mobileDir = path.join(__dirname, 'apps', 'mobile');
allPassed &= check(
  fs.existsSync(mobileDir),
  'Mobile app directory exists'
);

// Check 2: package.json exists
const packageJson = path.join(mobileDir, 'package.json');
allPassed &= check(
  fs.existsSync(packageJson),
  'package.json exists'
);

// Check 3: .env file exists
const envFile = path.join(mobileDir, '.env');
const hasEnv = fs.existsSync(envFile);
allPassed &= check(hasEnv, '.env file created');

if (hasEnv) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  const hasApiUrl = envContent.includes('EXPO_PUBLIC_API_URL');
  allPassed &= check(hasApiUrl, 'API URL configured in .env');
}

// Check 4: API client updated
const apiClient = path.join(mobileDir, 'utils', 'apiClient.ts');
if (fs.existsSync(apiClient)) {
  const content = fs.readFileSync(apiClient, 'utf8');
  const hasNumImages = content.includes('num_images_received');
  allPassed &= check(
    hasNumImages,
    'API client has num_images_received field (backend compatible)'
  );
} else {
  allPassed &= check(false, 'API client exists');
}

// Check 5: Key screens exist
const screens = ['index.tsx', 'camera-capture.tsx', 'results.tsx', 'treatment.tsx'];
screens.forEach(screen => {
  const screenPath = path.join(mobileDir, 'app', screen);
  allPassed &= check(
    fs.existsSync(screenPath),
    `Screen ${screen} exists`
  );
});

// Check 6: Key components exist
const components = ['Button.tsx', 'ConfidenceBadge.tsx', 'ConfidenceInfoModal.tsx'];
components.forEach(component => {
  const componentPath = path.join(mobileDir, 'components', component);
  allPassed &= check(
    fs.existsSync(componentPath),
    `Component ${component} exists`
  );
});

// Check 7: node_modules installed
const nodeModules = path.join(mobileDir, 'node_modules');
const hasNodeModules = fs.existsSync(nodeModules);
if (!hasNodeModules) {
  console.log(`${COLORS.YELLOW}⚠${COLORS.RESET} node_modules not installed`);
  info('Run: cd apps/mobile && npm install');
}

console.log(`\n${COLORS.BOLD}Summary:${COLORS.RESET}`);
if (allPassed && hasNodeModules) {
  console.log(`${COLORS.GREEN}${COLORS.BOLD}✓ Mobile app is ready to run!${COLORS.RESET}\n`);
  console.log('To start the app:');
  console.log('  cd apps/mobile');
  console.log('  npm start');
} else if (allPassed && !hasNodeModules) {
  console.log(`${COLORS.YELLOW}${COLORS.BOLD}⚠ Almost ready - install dependencies${COLORS.RESET}\n`);
  console.log('Run these commands:');
  console.log('  cd apps/mobile');
  console.log('  npm install');
  console.log('  npm start');
} else {
  console.log(`${COLORS.RED}${COLORS.BOLD}✗ Some checks failed${COLORS.RESET}\n`);
  console.log('Please review the failed checks above.');
}

console.log();
