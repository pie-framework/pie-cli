# serve-question 
---

Run a server to serve this question. Any changes to the `pie` source code, the `config.json` or the `index.html` will be picked up. However if you add a new component to the `config.json` this won't be picked up, you'll have to restart the server.

### Options
  `--dir` - the relative path to a directory to use as the root. This should contain `config.json` and `index.html` (default: the current working directory)
  `--port` - the port to use - default `4000`
  `--clean` - clean build assets before serving. Do this if you've added a new component. default: `false`
  `--bundleName` - the name of the generated bundle - default `pie.js`
  `--controllersFilename` - the name of the generated controllers file - default `controllers.js`
  `--pieBranch` - what branch of the pie dependencies (pie-player, pie-control-panel, etc) to use: default: `develop`
  `--support` - a js file to load to add support for a build type. See below.
  `--questionConfigFile` - the name of the pie data file - default `config.json`
  `--questionDependenciesFile` - the name of the pie data file - default `config.json`
  `--questionMarkupFile` - the name of layout file - default `index.html`
  
### Examples
```shell
pie serve-question --dir ../path/to/dir
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
