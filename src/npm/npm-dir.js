import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import { spawn } from 'child_process';
import readline from 'readline';
import * as helper from './dependency-helper';
import { fileLogger } from '../log-factory';

export default class NpmDir {

  constructor(rootDir) {
    this.rootDir = rootDir;
    this._logger = fileLogger(__filename);
    this._logger.debug(`rootDir: ${rootDir}`);

    let spawnPromise = (args) => {

      this._logger.info('spawn promise: args: ', args);

      let p = new Promise((resolve, reject) => {

        let s = spawn('npm', args, { cwd: this.rootDir });

        s.on('error', () => {
          this._logger.error('npm install command failed - is npm installed?');
          reject();
        });

        readline.createInterface({
          input: s.stderr,
          terminal: false
        }).on('line', function (line) {
          this._logger.error(line);
        });

        readline.createInterface({
          input: s.stdout,
          terminal: false
        }).on('line', function (line) {
          this._logger.info(line);
        });

        s.on('close', (code) => {
          if (code !== 0) {
            this._logger.error(args + ' failed. code: ' + code);
            reject();
          } else {
            resolve();
          }
        });
      });
      return p;
    };

    let linkPromise = (p) => spawnPromise(['link', p]);
  }


  isInstalled() {
    this._logger.silly('isInstalled');
    return false;
  };

  writePackageJson(pies) {

    this._logger.silly('pies: ', pies);
    let dependencies = _.mapValues(pies, (v, k) => {
      return path.relative(this.rootDir, v)
    });

    this._logger.silly('generated dependencies: ', dependencies);

    let pkg = {
      name: 'tmp',
      version: '0.0.1',
      private: true,
      dependencies: dependencies
    };

    fs.writeJsonSync(path.join(this.rootDir, 'package.json'), pkg);

    return Promise.resolve(pies);
  };

  freshInstall(pies) {
    fs.removeSync(path.join(this.rootDir, 'node_modules'));
    fs.removeSync(path.join(this.rootDir, 'package.json'));

    return this.writePackageJson(pies)
      .then(() => this.install)
      .then(() => this.linkLocalPies(pies));
  };

  linkLocalPies(pies) {

    let localOnlyDependencies = _.pickBy(pies, (v) => {
      return !helper.isSemver(v) && !helper.isGitUrl(v) && helper.pathIsDir(this.rootDir, v);
    });

    let out = _.values(localOnlyDependencies).reduce((acc, p) => {
      return acc.then(() => linkPromise(path.relative(this.rootDir, p)));
    }, Promise.resolve());
    return out;
  };

  install() {
    this._logger.silly('install');
    return spawnPromise(['install']);
  };
}
