import {SupportInfo} from '../support-info';

let config: SupportInfo = {
  npmDependencies: {
    'babel-preset-react': '~6.16.0'
  },
  webpackLoaders: (resolve) => {
    return [
      {
        test: /\.(jsx)?$/,
        loader: 'babel-loader',
        //Don't read in .babelrc files from the dependencies
        query: {
          babelrc: false,
          presets: [
            resolve('babel-preset-react')
          ]
        }
      }
    ]
  }
};

export default config;