# pie-cli 

[![Build Status](https://travis-ci.org/PieLabs/pie-cli.svg?branch=develop)](https://travis-ci.org/PieLabs/pie-cli)

## Install

```bash
npm install -g pie
```

#### Developer install 

```bash
git clone git@github.com:PieLabs/pie-cli.git 
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

* run `npm run source-maps`
* run `node --debug-brk $(which pie) ....`

Node is now running in debug mode on `5858` so boot up a debugger. Visual Studio Code has nice typescript debugging support. In VS: 

* add a breakpoint to the ts src file you want to debug.
* press `F5`.
* If you have no debug config it'll ask you to add one.
* Add the following: 

```json
 {
      "type": "node",
      "request": "attach",
      "name": "Attach to Process",
      "port": 5858,
      "outFiles": [
        "${workspaceRoot}/lib/**/*.js"
      ],
      "sourceMaps": true
    }
```

* select this runner and the app will start and hit your breakpoint.


#### Contributing

If you are commiting a code change that is worthy of being included in the release information, write your commit message using the [angular commit conventions outlined here](https://github.com/conventional-changelog/conventional-changelog-angular/blob/master/convention.md). These commit formats will automatically be included in the release notes.

#### Tests

##### Unit
```
npm test
```

##### Integration 

> The integration tests are slower than the unit tests because of all the `npm install` commands. 
You'll probably want to run the 1 at a time like so: 

```shell
mocha --require test/init test/integration/framework-support/support-module-test.js
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

```shell
# check the version in package.json is ok (keep the `-prerelease` label - it'll be stripped automatically), then..
npm run release
```

##### Credits

> Special thanks to Ken Pratt @kenpratt for the `pie` npm package name
