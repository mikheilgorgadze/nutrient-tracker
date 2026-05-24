#!/usr/bin/env node
/**
 * Bumps the patch version in app.config.ts and increments versionCode.
 * Usage: node scripts/bump-version.mjs
 */
import { readFileSync, writeFileSync } from 'fs';

const configPath = 'app.config.ts';
let src = readFileSync(configPath, 'utf8');

// Bump semantic version patch
const verMatch = src.match(/version:\s*'(\d+)\.(\d+)\.(\d+)'/);
if (!verMatch) { console.error('Could not find version in app.config.ts'); process.exit(1); }
const [, major, minor, patch] = verMatch;
const newVersion = `${major}.${minor}.${Number(patch) + 1}`;
src = src.replace(/version:\s*'[\d.]+'/, `version: '${newVersion}'`);

// Bump versionCode (integer used by Android)
const vcMatch = src.match(/versionCode:\s*(\d+)/);
if (vcMatch) {
  src = src.replace(/versionCode:\s*\d+/, `versionCode: ${Number(vcMatch[1]) + 1}`);
} else {
  // Insert versionCode into android block if missing
  src = src.replace(
    /android:\s*\{/,
    `android: {\n    versionCode: 2,`,
  );
}

writeFileSync(configPath, src);
console.log(`Bumped to ${newVersion}`);
