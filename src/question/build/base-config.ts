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
                modules: false
              }
            }]
        },
        {
          test: /\.(png|jpg|gif|svg|eot|ttf|woff|woff2|otf)$/,
          use: [
            {
              loader: 'url-loader',
              options: {
                limit: 10000
              }
            }
          ]
        }
      ]
    },
    resolveLoader: {
      modules: ['node_modules', resolve(join(root, 'node_modules'))],
    }
  };
};
