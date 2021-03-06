import pkg from './package.json';

export default {
  input: 'index.mjs',
  external: (
    Object.keys (pkg.peerDependencies)
    .concat (Object.keys (pkg.dependencies))
  ),
  output: {
    format: 'umd',
    name: 'reactCollect',
    file: 'index.js'
  }
};
