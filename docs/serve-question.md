# serve-question 
---

Run a server to serve this question. Any changes to the `pies` will be picked up.

### Options
  `--pieBranch` - what branch of the pie dependencies (pie-player, pie-control-panel, etc) to use: default: `develop`.
  `--clean` - clean build assets before packing. default: `false`
  `--support` - a js file to load to add support for a build type. See below.
  `--dir` - the relative path to a directory to use as the root. This should contain `config.json` and `index.html` (default: the current working directory)
  `--configFile` - the name of the pie data file - default `config.json`
  `--dependenciesFile` - the name of the dependencies file (to be removed) - default `dependencies.json`
  
### Examples
```shell
pie serve-question --dir ../path/to/dir
```
