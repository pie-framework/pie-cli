import { SupportInfo } from '../support-info';

let config: SupportInfo = {
  npmDependencies: {
    'less-loader': '^2.2.3'
  },
  rules: [
    {

      test: /\.less$/,
      use: ['style-loader', 'css-loader', 'less-loader']
    }
  ]
};

export default config;

