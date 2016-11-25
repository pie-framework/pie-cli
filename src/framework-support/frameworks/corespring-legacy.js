export function support(dependencies) {

  let isLegacy = Object.getOwnPropertyNames(dependencies).filter(name => {
    return name.indexOf('corespring-legacy') === 0;
  }).length > 0;

  if (isLegacy) {
    return {
      // This is a temporary option only present to handle the
      // MathJax dependency and we plan to remove it.
      externals: {
        js: ['//cdn.mathjax.org/mathjax/2.7-latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML'],
        css: []
      },
      npmDependencies: {
        'css-loader': '0.9.0',
        'file-loader': '^0.9.0',
        'less-loader': '^2.2.3'
      },
      webpackLoaders: () => {
        return [
          {
            test: /\.(eot|svg|ttf|woff|woff2)([#?].*)?$/,
            loader: 'file?{"name":"public/fonts/[name].[ext]"}'
          },
          {
            test: /libs\/styles\/images\/.*\.(svg|png)([#?].*)?$/,
            loader: 'file?{"name":"public/[path][name].[ext]", "context":"./node_modules/corespring-legacy-component-dependencies/libs/styles"}'
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