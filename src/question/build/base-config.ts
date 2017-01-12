import { resolve, join } from 'path';
import * as webpack from 'webpack';

export default (root): any => {
  return {
    module: {
      loaders: [
        {
          test: /\.css$/,
          loader: 'style-loader!css-loader'
        }
      ]
    },
    resolveLoader: {
      modules: [resolve(join(root, 'node_modules'))],
    }
  };
};