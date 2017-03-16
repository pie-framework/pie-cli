import { join, resolve } from 'path';

export default (root): any => {
  return {
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader']
        }
      ]
    },
    resolveLoader: {
      modules: ['node_modules', resolve(join(root, 'node_modules'))],
    }
  };
};
