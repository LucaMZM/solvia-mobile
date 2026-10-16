#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const projectRoot = process.cwd();
const assetRoot = path.join(projectRoot, 'assets', 'weather-hero');
const manifestPath = path.join(assetRoot, 'manifest.json');
const activeMetadataPath = path.join(assetRoot, 'active-assets-metadata.json');
const activeAssetNames = [
  'sunny.png',
  'partly-cloudy.png',
  'cloudy.png',
  'rain.png',
  'storm.png',
  'wind.png',
  'night-clear.png',
  'night-cloudy.png',
  'fog.png',
  'snow.png',
];
const requiredActiveMetadataFields = [
  'assetName',
  'state',
  'source',
  'author',
  'license',
  'attributionRequired',
  'commercialUseAllowed',
  'replacementNotes',
];

const requiredMetadataFields = [
  'id',
  'weatherState',
  'filePath',
  'format',
  'kind',
  'source',
  'author',
  'license',
  'attributionRequired',
  'commercialUseAllowed',
  'notes',
];

function readJson(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`No se pudo leer JSON en ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function validateManifest(manifest) {
  if (!manifest || typeof manifest !== 'object') {
    return ['Manifest inválido: debe ser un objeto JSON.'];
  }

  if (!Array.isArray(manifest.assets) || manifest.assets.length === 0) {
    return ['Manifest inválido: "assets" debe ser un array con entradas.'];
  }

  return [];
}

function validateStateEntry(entry) {
  const errors = [];
  if (!entry || typeof entry !== 'object') {
    return ['Entrada de estado inválida en manifest.'];
  }
  if (typeof entry.id !== 'string' || entry.id.length === 0) {
    errors.push('Falta "id" en una entrada del manifest.');
  }
  if (typeof entry.weatherState !== 'string' || entry.weatherState.length === 0) {
    errors.push('Falta "weatherState" en una entrada del manifest.');
  }
  if (typeof entry.artworkKey !== 'string' || entry.artworkKey.length === 0) {
    errors.push(`Falta "artworkKey" para estado ${entry.weatherState ?? '(desconocido)'}.`);
  }
  if (typeof entry.metadataPath !== 'string' || entry.metadataPath.length === 0) {
    errors.push(`Falta "metadataPath" para estado ${entry.weatherState ?? '(desconocido)'}.`);
  }
  if (typeof entry.defaultFilePath !== 'string' || entry.defaultFilePath.length === 0) {
    errors.push(`Falta "defaultFilePath" para estado ${entry.weatherState ?? '(desconocido)'}.`);
  }
  return errors;
}

function validateMetadata(metadata, state) {
  const errors = [];
  for (const field of requiredMetadataFields) {
    if (!(field in metadata)) {
      errors.push(`[${state}] Falta campo requerido en metadata: ${field}`);
    }
  }

  if (metadata.weatherState !== state) {
    errors.push(`[${state}] "weatherState" en metadata no coincide con el estado del manifest.`);
  }

  if (typeof metadata.attributionRequired !== 'boolean') {
    errors.push(`[${state}] "attributionRequired" debe ser boolean.`);
  }

  if (typeof metadata.commercialUseAllowed !== 'boolean') {
    errors.push(`[${state}] "commercialUseAllowed" debe ser boolean.`);
  }

  return errors;
}

function run() {
  if (!fs.existsSync(manifestPath)) {
    console.error(`❌ No existe manifest: ${manifestPath}`);
    process.exit(1);
  }

  const manifest = readJson(manifestPath);
  const errors = [...validateManifest(manifest)];
  const warnings = [];

  if (!fs.existsSync(activeMetadataPath)) {
    errors.push(`No existe metadata del pack PNG activo: ${activeMetadataPath}`);
  } else {
    const activeMetadata = readJson(activeMetadataPath);
    const entries = Array.isArray(activeMetadata.assets) ? activeMetadata.assets : [];
    for (const assetName of activeAssetNames) {
      const assetPath = path.join(assetRoot, assetName);
      if (!fs.existsSync(assetPath)) {
        errors.push(`Falta asset PNG activo: assets/weather-hero/${assetName}`);
        continue;
      }

      const metadata = entries.find((entry) => entry?.assetName === assetName);
      if (!metadata) {
        errors.push(`Falta metadata para el asset activo ${assetName}.`);
        continue;
      }
      for (const field of requiredActiveMetadataFields) {
        if (!(field in metadata)) {
          errors.push(`[${assetName}] Falta campo legal/técnico: ${field}`);
        }
      }
      if (metadata.attributionRequired == null) {
        warnings.push(`[${assetName}] Obligación de atribución pendiente de verificar.`);
      }
      if (metadata.commercialUseAllowed !== true) {
        warnings.push(`[${assetName}] Uso comercial pendiente de verificación; no publicar este asset todavía.`);
      }
    }
  }

  for (const entry of manifest.assets ?? []) {
    const entryErrors = validateStateEntry(entry);
    errors.push(...entryErrors);
    if (entryErrors.length > 0) {
      continue;
    }

    const metadataFilePath = path.join(projectRoot, entry.metadataPath);
    if (!fs.existsSync(metadataFilePath)) {
      errors.push(`[${entry.weatherState}] No existe metadata en ${entry.metadataPath}`);
      continue;
    }

    const metadata = readJson(metadataFilePath);
    errors.push(...validateMetadata(metadata, entry.weatherState));

    if (typeof metadata.filePath === 'string' && metadata.filePath.length > 0) {
      const candidateAssetPath = path.join(projectRoot, metadata.filePath);
      if (!fs.existsSync(candidateAssetPath)) {
        warnings.push(
          `[${entry.weatherState}] "filePath" apunta a ${metadata.filePath}, pero no existe aún (se usará fallback procedural).`,
        );
      }
    }
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Avisos de assets hero:');
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }

  if (errors.length > 0) {
    console.error('❌ Validación de assets hero fallida:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('✅ Assets hero validados correctamente.');
}

run();
