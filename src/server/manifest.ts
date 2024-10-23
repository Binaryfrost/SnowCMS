import fs from 'fs/promises';

let manifest: Record<string, string> = {};

export async function updateManifest() {
  manifest = JSON.parse(await fs.readFile('../client/manifest.json', {
    encoding: 'utf8'
  }));
}

export async function getManifest() {
  if (Object.keys(manifest).length === 0) {
    await updateManifest();
  }

  return manifest;
}
