
## Support 
You can point to a js file to add support for a framework that has been added to a pie's `dependencies` object in the `package.json`.



The module should return an object that contains `npmDependencies : Object` and `webpackLoaders : (resolve) => Object`. 

The module may have the following exports: 

* export a default object `export default { npmDependencies: {}, webpackLoaders: () => {}}`
* export a default function `export default function support(dependencies){ }`
* export a function named `support`: `export function support(dependencies){}`

Under the hood we use webpack to build the bundle and so these dependencies are what you'd use if you were doing your own webpack build.

Here are some examples: 


```javascript
//default object 

export default {
  npmDependencies: {
    a: '1.0.0'
  },
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
    /** return any dependencies that'll need to be added to support that framework when run against webpack.*/
    npmDependencies: {},
    /** return an array of loaders for the framework 
     * @param resolve a function that will resolve the module (to be removed)
     */
    webpackLoaders: (resolve) => {
      return [{ test: /\.suffix$/, loader: 'x!y!z' }]
    }
  };
}
```

### Support Limitations

* don't add paths to the `loader` string in support. ie: `'export?MODULE!path/to/my/module'` won't be handled correctly. Instead this loader should be declared inline becaues it needs to bind the query to the path.

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
