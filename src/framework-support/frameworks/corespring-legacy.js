export function support(dependencies) {

  let isLegacy = Object.getOwnPropertyNames(dependencies).filter(name => {
    return name.indexOf('corespring-legacy') === 0;
  }).length > 0;

  if (isLegacy) {
    return {
      npmDependencies: {
        'css-loader': '0.9.0',
        'file-loader': '^0.9.0',
        'less-loader': '^2.2.3'
      },
      webpackLoaders: () => {
        return [
          {
            test: /\.(eot|svg|ttf|woff|woff2)([#?].*)?$/,
            loader: 'file?name=public/fonts/[name].[ext]'
          },
          {
            test: /\/images\/feedback\/.*\.png/,
            loader: 'file?{"name":"public/images/feedback/[name].[ext]"}'
          }
        ];
      }
    }
  }
}