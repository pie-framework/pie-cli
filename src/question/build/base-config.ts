import { resolve, join } from 'path';
import * as webpack from 'webpack';

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