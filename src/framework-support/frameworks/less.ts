import {SupportInfo} from '../support-info';

let config : SupportInfo = {
  npmDependencies: {
    'less-loader': '^2.2.3'
  },
  webpackLoaders: () => [
    {
      test: /\.less$/,
      loader: "style!css!less"
    }
  ]
};

export default config;

