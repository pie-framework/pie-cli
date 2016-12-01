import * as fs from 'fs-extra';
import * as path from 'path';
import * as _ from 'lodash';
import { spawn } from 'child_process';
import * as readline from 'readline';
import * as helper from './dependency-helper';
import { buildLogger } from '../log-factory';
import { removeFiles } from '../file-helper';

let logger = buildLogger();

export default class NpmDir {

  constructor(readonly rootDir) {
    logger.debug(`rootDir: ${rootDir}`);
  }

  _spawnPromise(args: string[], ignoreExitCode: boolean = false): Promise<{ stdout: string }> {

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

  _exists(name) {
    return fs.existsSync(path.join(this.rootDir, name));
  }
  /**
   * install more dependencies
   */
  installMoreDependencies(dependencies, opts) {

    logger.info('[installMoreDependencies] ', dependencies);

    let needsInstalling = (value, key) => !this._exists(`node_modules/${key}`);

    let getInstallName = (value, key) => {
      if (helper.isSemver(value)) {
        return `${key}@${value}`;
      } else {
        return value;
      }
    }

    let deps = _(dependencies).pickBy(needsInstalling).map(getInstallName).value();

    logger.silly('[installMoreDependencies] deps:', JSON.stringify(deps));

    let save = (opts && opts.save) ? ['--save'] : [];

    if (deps.length === 0) {
      logger.info(`skipping the installation of ${_.keys(dependencies).join(', ')}`);
      return Promise.resolve({ skipped: true });
    } else {
      return this._install(deps.concat(save));
    }
  };

  install(dependencies) {
    logger.info('[install] ...');
    return this._writePackageJson(dependencies)
      .then(() => this._install());
  };

  _install(args?: any[]) {
    args = args || [];
    let cmd = ['install'].concat(args);
    logger.silly('[install] > final cmd: ', cmd.join(' '));
    return this._spawnPromise(cmd);
  };

  get _installed() {
    return fs.existsSync(path.join(this.rootDir, 'node_modules'));
  }

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
}
