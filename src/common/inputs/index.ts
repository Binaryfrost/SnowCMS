import InputRegistry from '../InputRegistry';

// Registers all built-in Inputs
export function registerBuiltInInputs() {
  // @ts-expect-error require.context is a Webpack feature
  const context = require.context(
    './',
    false,
    /\.tsx$/
  );

  context.keys()
    .filter((inputFile) => !inputFile.startsWith('./_'))
    .forEach((inputFile) => {
      InputRegistry.addInput(context(inputFile).default);
    });
}
