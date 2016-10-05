export let frameworkName = 'react';

/** 
 * @param name 
 * @param resolve - a function to resolve the module by the given name.
 * using resolved modules due to issues w/ symlinking and webpack/babel-loader
 * @see: https://github.com/webpack/webpack/issues/1866
 * @see: https://github.com/babel/babel-loader/issues/149
 */
export function support(name) {

  if (name !== frameworkName) {
    return;
  }
  
  return {
    npmDependencies: {
      'babel-preset-es2015': '~6.16.0',
      'babel-preset-react': '~6.16.0'
    },
    webpackLoaders: (resolve) => {
      return [
        {
          test: /.(jsx)?$/,
          loader: 'babel-loader',
          query: {
            presets: [
              resolve('babel-preset-es2015'),
              resolve('babel-preset-react')
            ]
          }
        }
      ]
    }
  };
}