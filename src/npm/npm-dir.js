import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';
import { spawn } from 'child_process';
import readline from 'readline';
import * as helper from './dependency-helper';

export default class NpmDir {

  constructor() {
    this.root = root;
    import { fileLogger } from '../log-factory';
    this._logger = fileLogger(__filename);
    this._logger.debug(`root: ${root}`);


    let spawnPromise = (args) => {

      this._logger.info('spawn promise: args: ', args);

      let p = new Promise((resolve, reject) => {

        let s = spawn('npm', args, { cwd: root });

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
      return path.relative(root, v)
    });

    this._logger.silly('generated dependencies: ', dependencies);

    let pkg = {
      name: 'tmp',
      version: '0.0.1',
      private: true,
      dependencies: dependencies
    };

    fs.writeJsonSync(path.join(root, 'package.json'), pkg);

    return Promise.resolve(pies);
  };

  freshInstall(pies) {
    fs.removeSync(path.join(root, 'node_modules'));
    fs.removeSync(path.join(root, 'package.json'));

    return this.writePackageJson(pies)
      .then(this.install)
      .then(() => this.linkLocalPies(pies));
  };

  linkLocalPies(pies) {

    let localOnlyDependencies = _.pickBy(pies, (v) => {
      return !helper.isSemver(v) && !helper.isGitUrl(v) && helper.pathIsDir(root, v);
    });

    let out = _.values(localOnlyDependencies).reduce((acc, p) => {
      return acc.then(() => linkPromise(path.relative(root, p)));
    }, Promise.resolve());
    return out;
  };

  install() {
    this._logger.silly('install');
    return spawnPromise(['install']);
  };
}
