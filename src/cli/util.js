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

export async function findPackageRoot(dir, skipNodeModules = false) {
  const packageJson = path.join(dir, 'package.json');
  if (await exists(packageJson)) {
    if (!skipNodeModules || (skipNodeModules && !packageJson.includes('node_modules'))) {
      return dir;
    }
  }

  const upOneLevel = path.join(dir, '..');
  // At the root of the file system going up one level won't change the path
  if (dir === upOneLevel) throw new Error('Failed to find package root');
  return findPackageRoot(upOneLevel, skipNodeModules);
}

/*
 * The node_modules directory is in a different location
 * in production (as a sub-directory of the SnowCMS directory)
 * vs in development (parent directory of the SnowCMS directory).
 * This method returns the correct location of node_modules.
 *
 * The dir param should be passed to findPackageRoot first.
 */
export async function findNodeModules(dir) {
  const upOneLevel = path.join(dir, '..');

  // If installed from NPM
  if (path.basename(upOneLevel) === 'node_modules') {
    return upOneLevel;
  }

  // If installed from GitHub for development
  const nodeModules = path.join(dir, 'node_modules');
  if (await exists(nodeModules)) {
    return nodeModules;
  }

  throw new Error('Failed to find node_modules');
}
