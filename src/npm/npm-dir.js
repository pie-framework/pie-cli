import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import { spawn } from 'child_process';
import readline from 'readline';
import * as helper from './dependency-helper';
import { fileLogger } from '../log-factory';
import {removeFiles} from '../file-helper';

let logger = fileLogger(__filename);

export default class NpmDir {

  constructor(rootDir) {
    this.rootDir = rootDir;
    logger.debug(`rootDir: ${rootDir}`);
  }

  _spawnPromise(args, ignoreExitCode) {
    ignoreExitCode = ignoreExitCode || false;
    
    logger.info('spawn promise: args: ', args);

    let p = new Promise((resolve, reject) => {

      let s = spawn('npm', args, { cwd: this.rootDir });

      let out = '';

      s.on('error', () => {
        logger.error('npm install command failed - is npm installed?');
        reject();
      });

      readline.createInterface({
        input: s.stderr,
        terminal: false
      }).on('line', (line) => {
        logger.error(line);
      });

      readline.createInterface({
        input: s.stdout,
        terminal: false
      }).on('line',  (line) => {
        logger.info(line);
        out += line;
      });

      s.on('close', (code) => {
        if (code !== 0 && !ignoreExitCode) {
          logger.error(args + ' failed. code: ' + code);
          reject();
        } else {
          resolve({stdout: out});
        }
      });
    });
    return p;
  };

  _linkPromise(p) {
    return this._spawnPromise(['link', p]);
  }

  isInstalled() {
    logger.silly('isInstalled');
    return false;
  };

  _writePackageJson(dependencies) {

    logger.silly('dependencies: ', dependencies);

    let pkg = {
      name: 'tmp',
      version: '0.0.1',
      private: true,
      dependencies: dependencies
    };

    fs.writeJsonSync(path.join(this.rootDir, 'package.json'), pkg);

    return Promise.resolve(pkg);
  };

  /**
   * Clean all npm related files
   */
  clean() {
    return removeFiles(this.rootDir, ['node_modules', 'package.json']);
  }

  //TODO: Clean up api here - install <> installMoreDependencies
  //Get it to more accurately reflect what actions are being taken.

  /**
   * install more dependencies
   */
  installMoreDependencies(dependencies, opts){
    let deps = _.map(dependencies, (value, key) => {
      if(helper.isSemver(value)){
        return `${key}@${value}`;
      } else {
        return value;
      }
    });

    let save = (opts && opts.save) ? ['--save'] : [];
    return this._install(deps.concat(save));
  };

  install(dependencies) {
    return this._writePackageJson(dependencies)
      .then(() => this._install())
      .then(() => this._linkLocalPies(dependencies));
  };

  /**
   * List dependencies
   * @param depth - how deep to go down the dependency tree
   * 
   * Seeing this issue: https://github.com/npm/npm/issues/9693
   * This too: https://github.com/npm/npm/issues/10004
   * 
   * Going to have to bypass the errors.
   */
  ls(depth){
    depth = depth || 0;
    logger.silly('[ls] depth: ', depth);
    return this._spawnPromise(['ls', '--json', `--depth=${depth}`], true)
      .then((result) => {
        try{
          return JSON.parse(result.stdout)
        } 
        catch(e){
          logger.error(e);
          return {}
        }
      });
  }

  _linkLocalPies(pies) {

    let localOnlyDependencies = _.pickBy(pies, (v) => {
      return !helper.isSemver(v) && !helper.isGitUrl(v) && helper.pathIsDir(this.rootDir, v);
    });

    let out = _.values(localOnlyDependencies).reduce((acc, p) => {
      return acc.then(() => this._linkPromise(p));
    }, Promise.resolve());
    return out;
  };

  _install(args) {
    args = args || [];
    logger.silly('install');
    let cmd = ['install'].concat(args);
    logger.silly('[install] > final cmd: ', cmd.join(' '));
    return this._spawnPromise(cmd);
  };
}
