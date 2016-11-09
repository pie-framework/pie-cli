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

##### Credits

> Special thanks to Ken Pratt @kenpratt for the `pie` npm package name
