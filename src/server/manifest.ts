import fs from 'fs/promises';

let manifest: Record<string, string> = {};

export async function updateManifest() {
  try {
    manifest = JSON.parse(await fs.readFile('../client/manifest.json', {
      encoding: 'utf8'
    }));
  } catch (e) {
    console.error('Unable to open client manifest. Ensure that your working directory ' +
      'is the "server" directory and that the "client" directory has not been moved.', e);
  }
}

export async function getManifest() {
  if (Object.keys(manifest).length === 0) {
    await updateManifest();
  }

  return manifest;
}
