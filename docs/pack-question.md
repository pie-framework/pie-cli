# pack-question 
---
Generate some javascript for use in rendering the question.

It generates 2 javascript files: 
 * `pie.js` - contains all the logic for rendering, includes the individual pies, a pie-player definition and ??
 * `controllers.js` - contains a map of pie names to their controllers, exports the map to either `window` or `exports`.

> Note: This doesn't generate the final question for you. To do that you'll need to create the final html page, include the 2 js files above, and use a controller that can interact with the controller-map.js file. See [pie-docs](http://pielabs.github.io/pie-docs) for more infomation.

### Options
  `--pieBranch` - what branch of the pie dependencies (pie-player, pie-control-panel, etc) to use: default: `develop`.
  `--clean` - clean build assets before packing. default: `false`
  `--support` - a js file to load to add support for a build type. See below.
  `--dir` - the relative path to a directory to use as the root. This should contain `config.json` and `index.html` (default: the current working directory)
  `--configFile` - the name of the pie data file - default `config.json`
  `--keepBuildAssets` - keep supporting build assets (like node_modules etc) after packing has completed - default:  `true`
  `--dependenciesFile` - the name of the dependencies file (to be removed) - default `dependencies.json`
  `--buildExample` - build an example? - default: `false`
  `--markupFile` - if building an example - the name of the html file with the layout for the question. default: `false`
  `--exampleFile` - if building an example - the name of the generated example html file. default: `false`
  
### Examples
```shell
pie-cli pack-question --dir ../path/to/dir
```

#### Support 
You can point to a js file to add support for a framework that has been added to a pie's `dependencies` object in the `package.json`.
The module should (if it wants to support what's in the dependencies) an object that contains `npmDependencies : Object` and `webpackLoaders : (resolve) => Object`. Under the hood we use webpack to build the bundle and so these dependencies are what you'd use if you were doing your own webpack build.

> Out of the box `pie-cli` has support for `react` and `less`.

```javascript

/**
 * @param dependencies - an object containing the dependency name and an array of versions:
 * { react: ['15.0.2'] }
 */
export function support(dependencies){ 
  if(!dependencies['my-cool-framework']){
    return;
  }

  return {
    /** return any dependencies that'll need to be added to support that framework when run against webpack.*/
    npmDependencies: {},
    /** return an array of loaders for the framework 
     * @param resolve a function that will resolve the module (to be removed)
     */
    webpackLoaders: (resolve) => {
      return [] 
    }
  };
}
```
