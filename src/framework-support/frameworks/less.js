export function support(dependencies) {
  if (!dependencies.less) {
    return;
  }
  return {
    npmDependencies: {
      'less-loader': '^2.2.3',
    },
    webpackLoaders: () => [
      {
        test: /\.less$/,
        loader: "style!css!less"
      }
    ]
  }
}