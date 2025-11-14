#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Read main package.json version
const mainPackageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const targetVersion = mainPackageJson.version;

console.log(`Updating all packages to version: ${targetVersion}`);

// Get all package directories
const packagesDir = './packages';
const packages = fs.readdirSync(packagesDir, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory())
  .map(dirent => dirent.name);

packages.forEach(packageName => {
  const packageJsonPath = path.join(packagesDir, packageName, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const oldVersion = packageJson.version;
    
    packageJson.version = targetVersion;
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    console.log(`Updated ${packageName}: ${oldVersion} → ${targetVersion}`);
  } else {
    console.log(`Warning: ${packageJsonPath} not found`);
  }
});

console.log('Version sync complete!');