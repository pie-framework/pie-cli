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
        logger.verbose(line);
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
      .then(() => this._install());
  };

  _install(args) {
    args = args || [];
    let cmd = ['install'].concat(args);
    logger.silly('[install] > final cmd: ', cmd.join(' '));
    return this._spawnPromise(cmd);
  };
}
