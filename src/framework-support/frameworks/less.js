export function support(dependencies) {
  if (!dependencies.less) {
    return;
  }
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