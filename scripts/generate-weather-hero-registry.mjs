#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const manifestPath = path.join(projectRoot, 'assets', 'weather-hero', 'manifest.json');
const outputPath = path.join(projectRoot, 'src', 'features', 'weatherHeroAssets', 'generatedAssetRegistry.ts');

const EXTENSION_PRIORITY = ['.webp', '.png', '.json', '.riv', '.mp4'];
const KIND_BY_EXTENSION = {
  '.webp': 'image',
  '.png': 'image',
  '.json': 'lottie',
  '.riv': 'rive',
  '.mp4': 'video',
};
const FORMAT_BY_EXTENSION = {
  '.webp': 'webp',
  '.png': 'png',
  '.json': 'lottie_json',
  '.riv': 'rive',
  '.mp4': 'mp4',
};

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function detectAssetFile(absoluteStateDir) {
  if (!fs.existsSync(absoluteStateDir)) {
    return null;
  }
  const entries = fs.readdirSync(absoluteStateDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => {
      const lower = name.toLowerCase();
      if (lower === 'metadata.json') {
        return false;
      }
      return EXTENSION_PRIORITY.some((ext) => lower.endsWith(ext));
    });

  for (const ext of EXTENSION_PRIORITY) {
    const match = files.find((fileName) => fileName.toLowerCase().endsWith(ext));
    if (match) {
      return {
        fileName: match,
        extension: ext,
      };
    }
  }

  return null;
}

function stringifyStateEntry(entry) {
  const base = `filePath: ${entry.filePath ? `'${entry.filePath}'` : 'null'}, format: ${
    entry.format ? `'${entry.format}'` : 'null'
  }, kind: '${entry.kind}'`;

  if (entry.kind === 'image') {
    return `${base}, imageSource: ${entry.requireExpr ?? 'null'}`;
  }
  if (entry.kind === 'lottie') {
    return `${base}, lottieSource: ${entry.requireExpr ?? 'null'}`;
  }
  if (entry.kind === 'rive') {
    return `${base}, riveSource: ${entry.requireExpr ?? 'null'}`;
  }
  return `${base}, videoSource: ${entry.requireExpr ?? 'null'}`;
}

function run() {
  const manifest = readJson(manifestPath);
  const assets = Array.isArray(manifest.assets) ? manifest.assets : [];

  if (assets.length === 0) {
    throw new Error('Manifest sin assets. Revisa assets/weather-hero/manifest.json');
  }

  const lines = [];
  lines.push("import type { WeatherState } from '@/src/types/recommendations';");
  lines.push("import type { WeatherHeroAssetFormat, WeatherHeroAssetKind } from '@/src/features/weatherHeroAssets/types';");
  lines.push('');
  lines.push('export interface GeneratedWeatherHeroAssetEntry {');
  lines.push('  filePath: string | null;');
  lines.push('  format: WeatherHeroAssetFormat | null;');
  lines.push('  kind: WeatherHeroAssetKind;');
  lines.push('  imageSource?: unknown | null;');
  lines.push('  lottieSource?: unknown | null;');
  lines.push('  riveSource?: unknown | null;');
  lines.push('  videoSource?: unknown | null;');
  lines.push('}');
  lines.push('');
  lines.push('// Archivo generado automáticamente. No editar manualmente.');
  lines.push('export const generatedWeatherHeroRegistry: Record<WeatherState, GeneratedWeatherHeroAssetEntry> = {');

  for (const asset of assets) {
    const stateDir = path.join(projectRoot, 'assets', 'weather-hero', asset.weatherState);
    const detected = detectAssetFile(stateDir);
    if (!detected) {
      lines.push(`  ${asset.weatherState}: { filePath: null, format: null, kind: 'image', imageSource: null },`);
      continue;
    }

    const relativePath = `assets/weather-hero/${asset.weatherState}/${detected.fileName}`;
    const ext = detected.extension;
    const kind = KIND_BY_EXTENSION[ext];
    const format = FORMAT_BY_EXTENSION[ext];
    const requireExpr = `require('../../../${relativePath}')`;

    lines.push(
      `  ${asset.weatherState}: { ${stringifyStateEntry({
        filePath: relativePath,
        format,
        kind,
        requireExpr,
      })} },`,
    );
  }

  lines.push('};');
  lines.push('');

  fs.writeFileSync(outputPath, lines.join('\n'));
  console.log(`✅ Registry generado: ${path.relative(projectRoot, outputPath)}`);
}

run();
