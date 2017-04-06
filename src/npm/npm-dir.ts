import { ensureDirSync, existsSync, writeJsonSync } from 'fs-extra';

import { KeyMap } from './index';
import { buildLogger } from 'log-factory';
import { join } from 'path';
import { spawnPromise as sp } from '../io';

const logger = buildLogger();

export default class NpmDir {

  constructor(readonly rootDir) {
    logger.debug(`rootDir: ${rootDir}`);
  }

  public install(name: string, dependencies: KeyMap, devDeps: KeyMap, force: boolean) {
    logger.info('[install] ...');
    return this.writePackageJson(name, dependencies, devDeps)
      .then(() => this.runInstallCmd(force));
  };

  public ls() {
    logger.info('[ls]');
    if (!this._installed) {
      return this.runInstallCmd(false)
        .then(() => this.ls());
    } else {
      return this.spawnPromise(['ls', '--json'], true)
        .then((result) => {
          logger.debug('[ls] got ls result..');
          try {
            return JSON.parse(result.stdout);
          } catch (e) {
            logger.error('[ls] failed to parse stdout as json: ', result.stdout);
            throw e;
          }
        });
    }
  }

  private get _installed() {
    return existsSync(join(this.rootDir, 'node_modules'));
  }

  private writePackageJson(name: string, dependencies: KeyMap, devDeps: KeyMap) {

    logger.silly('dependencies: ', dependencies);

    const pkg = {
      dependencies,
      devDependencies: devDeps,
      name,
      private: true,
      version: '0.0.1'
    };
    ensureDirSync(this.rootDir);
    writeJsonSync(join(this.rootDir, 'package.json'), pkg);
    return Promise.resolve(pkg);
  };

  private runInstallCmd(force: boolean, args?: any[]) {
    logger.silly(`[_install], force: ${force}, args: ${args}`);
    if (this._installed && !force) {
      logger.debug(`[_install] node_modules exists - skipping install.`);
      return Promise.resolve({ stdout: 'skipped' });
    } else {
      args = args || [];
      const cmd = ['install'].concat(args);
      logger.silly('[_install] > final cmd: ', cmd.join(' '));
      return this.spawnPromise(cmd);
    }
  };

  private spawnPromise(args: string[], ignoreExitCode: boolean = false): Promise<{ stdout: string }> {
    const isWin = /^win/.test(process.platform);
    const cmd = isWin ? 'npm.cmd' : 'npm';
    return sp(cmd, this.rootDir, args, ignoreExitCode);
  };
}
