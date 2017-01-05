import * as fs from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import { spawn } from 'child_process';
import * as readline from 'readline';
import * as helper from './dependency-helper';
import { buildLogger } from '../log-factory';
import { KeyMap } from './types';

let logger = buildLogger();

export default class NpmDir {

  constructor(readonly rootDir) {
    logger.debug(`rootDir: ${rootDir}`);
  }

  install(name: string, dependencies: KeyMap, devDeps: KeyMap) {
    logger.info('[install] ...');
    return this._writePackageJson(name, dependencies, devDeps)
      .then(() => this._install());
  };

  ls() {
    logger.info('[ls]');
    if (!this._installed) {
      return this._install()
        .then(() => this.ls())
    } else {
      return this._spawnPromise(['ls', '--json'], true)
        .then((result) => {
          logger.debug('[ls] got ls result..');
          try {
            return JSON.parse(result.stdout)
          } catch (e) {
            logger.error('[ls] failed to parse stdout as json: ', result.stdout);
            throw e;
          }
        });
    }
  }

  private get _installed() {
    return fs.existsSync(path.join(this.rootDir, 'node_modules'));
  }

  private _exists(name) {
    return fs.existsSync(path.join(this.rootDir, name));
  }

  private _writePackageJson(name: string, dependencies: KeyMap, devDeps: KeyMap) {

    logger.silly('dependencies: ', dependencies);

    let pkg = {
      name: name,
      version: '0.0.1',
      private: true,
      dependencies: dependencies,
      devDependencies: devDeps
    };

    fs.writeJsonSync(path.join(this.rootDir, 'package.json'), pkg);
    return Promise.resolve(pkg);
  };


  private _install(args?: any[]) {
    args = args || [];
    let cmd = ['install'].concat(args);
    logger.silly('[install] > final cmd: ', cmd.join(' '));
    return this._spawnPromise(cmd);
  };


  private _spawnPromise(args: string[], ignoreExitCode: boolean = false): Promise<{ stdout: string }> {

    logger.debug('[_spawnPromise] args: ', args);

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
        //@see: https://github.com/npm/npm/issues/13656 an issue w/ npm 3.10.7
        let eventEmitterWarning = 'Possible EventEmitter memory leak detected';
        if (line.indexOf(eventEmitterWarning) !== -1) {
          logger.silly(line);
        } else {
          logger.error(line);
        }
      });

      readline.createInterface({
        input: s.stdout,
        terminal: false
      }).on('line', (line) => {
        logger.silly(line);
        out += line;
      });

      s.on('close', (code) => {
        if (code !== 0 && !ignoreExitCode) {
          logger.error(args + ' failed. code: ' + code);
          reject();
        } else {
          resolve({ stdout: out });
        }
      });
    });
    return p;
  };

}
