export function verifyNodeVersion() {
  const MIN_NODE_VERSION = 20;
  const majorVersion = process.versions.node.split('.')[0];
  if (majorVersion < MIN_NODE_VERSION) {
    throw new Error(`SnowCMS requires Node v${MIN_NODE_VERSION} or later`);
  }
}
