
## Support 
You can point to a js file to add support for a framework that has been added to a pie's `dependencies` object in the `package.json`.



The module should return an object that may contain:

* `npmDependencies: {}` - an object defining packages needed to support that framework when run against webpack.
* `webpackLoaders: (resolve) => {}` - a function returning an array of webpack loaders. The resolve function will locate the file by it's package name (note: this may be deprecated soon).

The module may have the following exports: 

* export a default object `export default { npmDependencies: {}, webpackLoaders: () => {}}`
* export a default function `export default function support(dependencies){ }`
* export a function named `support`: `export function support(dependencies){}`


Under the hood we use webpack to build the bundle and so these dependencies are what you'd use if you were doing your own webpack build.

Here are some examples: 


```javascript
//default object 

export default {

  /** [Optional] */
  npmDependencies: {
    a: '1.0.0'
  },
  /** [Optional] */
  webpackLoaders: (resolve) => {
    return [
      { test: /\.suffix$/, loader: 'x!y!z' }
    ]
  }
}

//function  
/**
 * @param dependencies - an object containing the dependency name and an array of versions:
 * { react: ['15.0.2'] }
 */
export /*default*/ function support(dependencies){ 
  if(!dependencies['my-cool-framework']){
    return;
  }

  return {
    /** [Optional] */ 
    npmDependencies: {},
    /** [Optional] */ 
    webpackLoaders: (resolve) => {
      return [{ test: /\.suffix$/, loader: 'x!y!z' }]
    }
  };
}
```

### Support/Webpack Limitations

* don't add paths to the `loader` string in support, this will fail in webpack. ie: `'export?MODULE!path/to/my/module'` won't be handled correctly. Instead this loader should be declared inline becaues it needs to bind the query to the path.

### Existing support 

Out of the box `pie-cli` has support for `react` and `less`. You don't need to add these to your support module.
If you do you'll get errors.

#### react 

React uses the [babel-loader](https://github.com/babel/babel-loader) with  [babel-preset-react](https://github.com/babel/babel/tree/master/packages/babel-preset-react) enabled.

#### less 

See: [less-loader](https://github.com/webpack/less-loader).

```javascript
  require("!style!css!less!./file.less");
```
