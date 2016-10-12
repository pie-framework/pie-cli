export function support(name) {
  if (name === 'less') {
    return {
      npmDependencies: {},
      webpackLoaders: () => [
        {
          test: /\.less$/,
          loader: "style!css!less"
        }
      ]
    }
  }
}