import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import { spawn } from 'child_process';
import readline from 'readline';
import * as helper from './dependency-helper';
import { buildLogger } from '../log-factory';
import { removeFiles } from '../file-helper';

let logger = buildLogger();

export default class NpmDir {

  constructor(rootDir) {
    this.rootDir = rootDir;
    logger.debug(`rootDir: ${rootDir}`);
  }

  _spawnPromise(args, ignoreExitCode) {
    ignoreExitCode = ignoreExitCode || false;

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
        logger.verbose(line);
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
    let pkgExists = this._exists('package.json')
    let nodeModulesExists = this._exists('node_modules');

    logger.silly('[install] pkgExists: ', pkgExists)
    if (pkgExists && nodeModulesExists) {
      logger.info('[install] skipping install cmd');
      return Promise.resolve({ skipped: true });
    } else {
      return this._writePackageJson(dependencies)
        .then(() => this._install());
    }
  };

  _install(args) {
    args = args || [];
    let cmd = ['install'].concat(args);
    logger.silly('[install] > final cmd: ', cmd.join(' '));
    return this._spawnPromise(cmd);
  };
}
