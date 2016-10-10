export function support(name) {
  if (name === 'vue') {
    return {
      npmDependencies: {
        'vue-loader': '~9.5.1'
      },
      webpackLoaders: (resolve) => {
        return [
          {
            test: /\.vue$/,
            loader: resolve('vue-loader')
          }
        ];
      }
    }
  }
}