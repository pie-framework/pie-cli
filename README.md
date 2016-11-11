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
