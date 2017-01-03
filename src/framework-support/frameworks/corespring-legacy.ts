import { SupportInfo } from '../support-info';


let startsWith = (s: string, t: string): boolean => s.indexOf(t) === 0;
let endsWith = (s: string, t: string): boolean => s.indexOf(t) === (s.length - t.length);

export function support(config): SupportInfo {

  let isLegacy = (config) => {
    return (config._raw && config._raw.elements) ? Object.getOwnPropertyNames(config._raw.elements).filter(name => {
      return startsWith(name, 'corespring-') && endsWith(name, '-ng15');
    }).length > 0 : false;
  };

  if (isLegacy(config)) {
    return {
      /** 
       * Note: This is a temporary option only present to handle the
       * MathJax dependency and we plan to remove it.
       */
      externals: {
        js: ['//cdn.mathjax.org/mathjax/2.7-latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML']
      },
      npmDependencies: {
        'css-loader': '0.9.0',
        'file-loader': '^0.9.0',
        'less-loader': '^2.2.3'
      },
      webpackLoaders: () => {
        return [
          {
            test: /fonts\/.*\.(eot|svg|ttf|woff|woff2)([#?].*)?$/,
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