import { SupportInfo } from '../support-info';
import { resolve } from 'path';

let startsWith = (s: string, t: string): boolean => s.indexOf(t) === 0;
let endsWith = (s: string, t: string): boolean => s.indexOf(t) === (s.length - t.length);

export function support(dependencies, rootDir: string): SupportInfo {

  let isLegacy = Object.getOwnPropertyNames(dependencies).filter(name => {
    return startsWith(name, 'corespring-') && endsWith(name, '-ng15');
  }).length > 0;

  if (isLegacy) {
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
      rules: [
        //Mathquill font support
        {
          test: /font\/.*\.(otf|eot|svg|ttf|woff|woff2)([#?].*)?$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: "public/font/[name].[ext]"
              }
            }
          ]
        },

        {
          test: /fonts\/.*\.(eot|svg|ttf|woff|woff2)([#?].*)?$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: "public/fonts/[name].[ext]"
              }
            }
          ]
        },
        /* Ignore other asset links to legacy-component-dependencies */
        {
          test: /.*corespring-legacy-component-dependencies.*\.(svg|png)/,

          include: [
            //libs with a nested reference to component-dependencies
            /.*node_modules\/.*node_modules.*/
          ],
          use: [
            {
              loader: 'file-loader',
              options: {
                emitFile: false,
              }
            }
          ]
        },
        {
          test: /.*corespring-legacy-component-dependencies.*\.(svg|png)/,
          exclude: [
            //libs with a nested reference to component-dependencies
            /.*node_modules\/.*node_modules.*/
          ],
          use: [
            {
              loader: 'file-loader',
              options: {
                name: "public/[path][name].[ext]",
                context: resolve(rootDir, "./node_modules/corespring-legacy-component-dependencies/libs/styles")
              }
            }
          ]
        },
        {
          test: /\/images\/feedback\/.*\.png/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: 'public/images/feedback/[name].[ext]'
              }
            }
          ]
        }
      ]
    }
  }
}
