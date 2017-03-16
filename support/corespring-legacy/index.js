
const startsWith = (s, t) => s.indexOf(t) === 0;
const endsWith = (s, t) => s.indexOf(t) === (s.length - t.length);

const isLegacy = (dependencies) => Object.getOwnPropertyNames(dependencies).filter(name => {
  return startsWith(name, 'corespring-') && endsWith(name, '-ng15');
}).length > 0;

module.exports = {

  support: (dependencies) => isLegacy(dependencies),

  /** 
    * Note: This is a temporary option only present to handle the
    * MathJax dependency and we plan to remove it.
    */
  externals: {
    js: ['//cdn.mathjax.org/mathjax/2.7-latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML']
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
            name: 'public/[path][name].[ext]',
            /**
             * The legacy component libraries are configured whereby the controller library
             * has access to the client side libraries. 
             * (This should really be fixed - but it's not worth doing until we know if we need this components or not.)
             * This means that client side assets will be picked up via the controller build.
             * The context below reflects that.
             */
            context: './.pie/.controllers/node_modules/corespring-legacy-component-dependencies/libs/styles'
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
};
