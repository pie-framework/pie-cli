export let frameworkName = 'react';

export function support(dependencies) {

  if (!dependencies.react) {
    return;
  }

  return {
    npmDependencies: {
      'babel-preset-react': '~6.16.0'
    },
    webpackLoaders: () => {
      return [
        {
          test: /.(jsx)?$/,
          loader: 'babel-loader',
          //Don't read in .babelrc files from the dependencies
          query: {
            babelrc: false,
            presets: [
              'babel-preset-react'
            ]
          },
          addExclude: true
        }
      ]
    }
  };
}