# pie-cli 

[![Build Status](https://travis-ci.org/PieLabs/pie-cli.svg?branch=develop)](https://travis-ci.org/PieLabs/pie-cli)

## Install

> !!! Not ready yet
The following won't be ready until we publish use the developer install instrucstions below.

```bash
npm install -g pie-cli 
```

#### Developer install 

```bash
git clone git@github.com:PieLabs/pie-cli.git 
cd pie-cli 
npm install -g babel-cli 
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
pie-lib --help
```

#### Tests

##### Unit
```
npm test
```

##### Integration 

> The integration tests are slower than the unit tests cos of all the `npm install` commands. You'll probably want to run the 1 at a time.

```
npm run it 
```

#### Build

```
npm run build
```

### get pie on npm

https://www.npmjs.com/package/pie

Seems like it's not in use anymore?

