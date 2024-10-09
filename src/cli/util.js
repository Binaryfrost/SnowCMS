import path from 'path';
import fs from 'fs/promises';

export async function exists(f) {
  try {
    await fs.stat(f);
    return true;
  } catch {
    return false;
  }
}

export async function findPackageRoot(dir) {
  const packageJson = path.join(dir, 'package.json');
  if (await exists(packageJson)) return dir;

  const upOneLevel = path.join(dir, '..');
  if (dir === upOneLevel) throw new Error('Failed to find package root');
  return findPackageRoot(upOneLevel);
}
