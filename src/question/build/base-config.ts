import { resolve, join } from 'path';
import * as webpack from 'webpack';

export default (root): webpack.Configuration => {
  return {
    module: {
      loaders: [
        {
          test: /\.css$/,
          loader: 'style!css'
        }
      ]
    },
    resolveLoader: {
      root: resolve(join(root, 'node_modules')),
    },
    resolve: {
      root: resolve(join(root, 'node_modules')),
      extensions: ['', '.js', '.jsx']
    }
  };
};