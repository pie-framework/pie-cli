# pie-cli

[![Build Status](https://travis-ci.org/pie-framework/pie-cli.svg?branch=master)](https://travis-ci.org/pie-framework/pie-cli)

## Install

```bash
npm install -g pie
```

#### Developer install

```bash
git clone git@github.com:pie-framework/pie-cli.git
cd pie-cli
npm install
npm run build
npm link

# pie-cli executable now points to /bin/pie-cli
```

## Usage

```
pie --help|-h
```

### Developing

If you want to play with the cli while developing you can watch the src, then link the repo so you can invoke the cli

```
npm link
npm run dev # runs -> 'gulp dev'
# in some other dir
pie --help
```

#### Debugging

To debug typescript you'll need to generate the sourcemaps. `gulp-typescript` doesn't do this at the moment, so we use `tsc` instead.

- run `npm run source-maps`
- run `node --debug-brk --inspect $(which pie) ....`

> Windows debugging: `node.exe --debug-brk --inspect "C:\Users\Edward Eustace\AppData\Roaming\npm\node_modules\pie\bin\pie" --version`

Node is now running in debug mode on `5858` so boot up a debugger. Visual Studio Code has nice typescript debugging support. In VS:

- add a breakpoint to the ts src file you want to debug.
- press `F5`.
- If you have no debug config it'll ask you to add one.
- Add the following:

```json
{
  "type": "node",
  "request": "attach",
  "protocol": "inspector",
  "name": "Attach to Process",
  "port": 9229,
  "outFiles": ["${workspaceRoot}/lib/**/*.js"],
  "sourceMaps": true
}
```

- select this runner and the app will start and hit your breakpoint.

#### Contributing

If you are commiting a code change that is worthy of being included in the release information, write your commit message using the [angular commit conventions outlined here](https://github.com/conventional-changelog/conventional-changelog-angular/blob/master/convention.md). These commit formats will automatically be included in the release notes.

#### Tests

##### Unit

```
npm test
```

##### Integration

> The integration tests are slower than the unit tests because of all the `npm install` commands.
> You'll probably want to run the 1 at a time like so:

```shell
mocha --require test/init test/integration/framework-support/support-module-test.js
```

or to run an individual test:

```shell
./node_modules/.bin/mocha  --require test/init.js  test/integration/init.js test/integration/cli/install-test.js
```

> `--require test/init` - inits babel and the logger.

To run them all:

```shell
npm run it
```

##### Test Coverage

```shell
npm install -g nyc
nyc npm test
```

#### Build

```
npm run build
```

#### Release

This creates a new github release from the `develop` branch:

> Be sure to only use npm for install - if you use yarn you may get publishing errors like: `TypeError: log.gauge.isEnabled is not a function`.

```shell
git checkout master
git merge develop
npm run release
```

## Architecture Notes

When you run any of the commands that generate/serve js you are running one or more webpack builds via an `App`. For example `pie info` uses the `InfoApp` which has a `serve` function. This method will run an `install` then run a server that will make use of `webpack-dev-middleware`.

The high level flow is: `cmd` -> `install` -> `prepare webpack config(s)` -> `run webpack build` | `run webpack-dev-middleware`.

### .pie - build directory

When you install, you are installing the dependencies for your `pie` package.
This happens in a directory called `.pie` that is relative to the `pie item` directory.

Inside the `.pie` directory is:

- `package.json` - the install generated package.json that lists the pies that are dependencies
- `.controllers` - the controllers install directory for controller related dependencies
- `.configure` - the configure install directory for configure related dependencies.
- `*.entry.js` - entry files for the given app type
- `*.config.js` - webpack config js files (useful for debugging builds)

### build support

The webpack builds inside `.pie` make use of some pre-installed support directories that are located in `pie-cli/support`. They are npm packages that get installed along with `pie-cli`. Their `node_modules` directories are added to the webpack `resolve.modules` and `resolveLoader.modules` arrays.

They also contain `rules` that can be added to a webpack config. All the apps in `pie-cli` make use of any rules in the default support packages.

We do this to speed up intallation by only having to install these once. It gives greater control over supporting libs are added to the webpack build.

The support package is a standard npm package and we hope to enable the inclusion of external support packages via command line options for custom builds.

#### legacy automatic support

The cli automatically supports react@16.x and less. Note that this support will be up for review shortly and may be removed.

##### Credits

> Special thanks to Ken Pratt @kenpratt for the `pie` npm package name
