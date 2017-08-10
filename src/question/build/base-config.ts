import { join, resolve } from 'path';

export default (root): any => {
  return {
    module: {
      rules: [
        {
          test: /\.css$/,
          use: ['style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: true
              }
            }]
        }
      ]
    },
    resolveLoader: {
      modules: ['node_modules', resolve(join(root, 'node_modules'))],
    }
  };
};
