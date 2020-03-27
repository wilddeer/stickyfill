import babel from 'rollup-plugin-babel';

const pkg = require('./package.json');

export default {
  input: './src/stickyfill.js',
  plugins: [
    babel(),
  ],
  output: {
    file: pkg.main,
    format: 'umd',
    moduleName: 'Stickyfill'
  }
};
