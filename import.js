#!/usr/bin/env node

'use strict';

var fs = require('fs');
var path = require('path');

var ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
var DEST_DIR = path.join(__dirname, 'public', 'images');

function printUsage() {
  console.log('Usage: npm run import -- --from "/path/to/source"');
  console.log('       node import.js --from "/path/to/source"');
  console.log('');
  console.log('Copies supported image files (.jpg .jpeg .png .webp .gif) to ./public/images');
  process.exit(1);
}

var args = process.argv.slice(2);
var fromIndex = args.indexOf('--from');

if (fromIndex === -1 || !args[fromIndex + 1]) {
  printUsage();
}

var sourceDir = path.resolve(args[fromIndex + 1]);

if (!fs.existsSync(sourceDir)) {
  console.error('Error: Source directory does not exist: ' + sourceDir);
  process.exit(1);
}

var stats;
try {
  stats = fs.statSync(sourceDir);
} catch (e) {
  console.error('Error: Cannot access source directory: ' + e.message);
  process.exit(1);
}

if (!stats.isDirectory()) {
  console.error('Error: Source path is not a directory: ' + sourceDir);
  process.exit(1);
}

if (!fs.existsSync(DEST_DIR)) {
  fs.mkdirSync(DEST_DIR, { recursive: true });
  console.log('Created destination directory: ' + DEST_DIR);
}

var files;
try {
  files = fs.readdirSync(sourceDir);
} catch (e) {
  console.error('Error: Cannot read source directory: ' + e.message);
  process.exit(1);
}

var copied = 0;
var skipped = 0;
var errors = 0;

for (var i = 0; i < files.length; i++) {
  var file = files[i];
  var ext = path.extname(file).toLowerCase();

  if (ALLOWED_EXTENSIONS.indexOf(ext) === -1) {
    skipped++;
    continue;
  }

  var srcPath = path.join(sourceDir, file);
  var destPath = path.join(DEST_DIR, file);

  try {
    var fileStats = fs.statSync(srcPath);
    if (!fileStats.isFile()) {
      skipped++;
      continue;
    }
  } catch (e) {
    skipped++;
    continue;
  }

  try {
    fs.copyFileSync(srcPath, destPath);
    console.log('✓ ' + file);
    copied++;
  } catch (err) {
    console.error('✗ ' + file + ': ' + err.message);
    errors++;
  }
}

console.log('');
console.log('Done. Copied: ' + copied + ', Skipped: ' + skipped + ', Errors: ' + errors);
process.exit(errors > 0 ? 1 : 0);
