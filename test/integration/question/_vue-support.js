export function support(dependencies) {
  if (dependencies.vue) {
    return {
      npmDependencies: {
        'vue-loader': '~9.5.1'
      },
      webpackLoaders: () => {
        return [
          {
            test: /\.vue$/,
            loader: 'vue-loader'
          }
        ];
      }
    }
  }
}