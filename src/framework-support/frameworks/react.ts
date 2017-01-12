import { SupportInfo } from '../support-info';

let config: SupportInfo = {
  npmDependencies: {
    'babel-preset-react': '~6.16.0'
  },
  rules: [
    {
      test: /\.(jsx)?$/,
      use: [
        {
          loader: 'babel-loader',
          options: {
            babelrc: false,
            presets: ['babel-preset-react']
          }
        }
      ]
    }
  ]
};

export default config;