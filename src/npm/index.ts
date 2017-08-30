import * as _ from 'lodash';

import { basename, join, resolve } from 'path';
import { existsSync, readJsonSync, remove, writeJson } from 'fs-extra';

import { buildLogger } from 'log-factory';
import { moduleIdForPath } from './module-identifier';
import { parseJson } from './output';
import { spawnPromise as sp } from '../io';

export type KeyMap = { [key: string]: string };

const logger = buildLogger();

export type InstallationInfo = {
  dependencies: { [key: string]: any }
};

export default class Npm {

  private pkgPath: string;

  constructor(readonly rootDir) {
    logger.debug(`rootDir: ${rootDir}`);
    if (!existsSync(this.rootDir)) {
      throw new Error(`npm root dir doesn't exist`);
    }
    this.pkgPath = join(this.rootDir, 'package.json');
  }

  get pkg(): { dependencies: { [key: string]: any } } {
    logger.silly('[get pkg] this.pkgPath: ', this.pkgPath);
    if (existsSync(this.pkgPath)) {
      return readJsonSync(this.pkgPath, { encoding: 'utf8' });
    }
  }

  /**
   * install dependencies if needed.
   * checks each id to see if it's already installed.
   * if not it runs an `install` for it. if it is is just runs an `ls`.
   * @param ids - the raw ids
   */
  public async installIfNeeded(ids: string[]): Promise<{ [key: string]: any }> {

    const withModuleIds = this.resolveModuleIds(ids);
    const grouped = _.groupBy(withModuleIds, m => m.moduleId === undefined ? 'not-installed' : 'already-installed');

    const notInstalled = grouped['not-installed'] || [];
    const alreadyInstalled = grouped['already-installed'] || [];

    const installationResult = await this.install(notInstalled.map(m => m.value));
    const lsResult = await this.ls(alreadyInstalled.map(m => m.moduleId));

    const tag = (t: string, o: { [key: string]: any }) => {
      return _.mapValues(o, v => {
        v.installationType = t;
        return v;
      });
    };

    return _.merge(
      tag('new-installation', installationResult.dependencies),
      tag('existing-installation', lsResult.dependencies));
  }

  public async clean(): Promise<void> {
    await remove(join(this.rootDir, 'node_modules'));
    await remove(join(this.rootDir, 'package.json'));
  }

  public async install(dependencies: string[]): Promise<InstallationInfo> {
    if (dependencies.length === 0) {
      return { dependencies: {} };
    } else {
      logger.info('[install] ...');
      if (!this.pkg) {
        await this.writePackageJson();
      }

      const result = await this.runInstallCmd(dependencies);
      logger.silly(`[install] result: `, result);
      return result;
    }
  }

  public async ls(moduleIds: string[]): Promise<InstallationInfo> {
    if (moduleIds.length === 0) {
      return {
        dependencies: {}
      };
    } else {
      const raw = await sp('npm', this.rootDir, [
        'ls',
        ...moduleIds,
        '--json'
      ]);
      logger.debug(this.rootDir, 'stdout: ', raw.stdout);
      return parseJson(raw.stdout);
    }
  }

  public moduleIdForPath(path: string): string {
    return moduleIdForPath(this.rootDir, this.pkg, path);
  }

  private writePackageJson(): Promise<any> {
    logger.silly('[writePackageJson]: ', this.rootDir);
    return writeJson(join(this.rootDir, 'package.json'), {
      description: 'internal npm package',
      license: 'MIT',
      name: basename(this.rootDir).replace('.', '_'),
      private: true,
      readme: '',
      version: '0.0.1'
    });
  }

  private async runInstallCmd(deps: string[]): Promise<any> {

    logger.silly('[runInstallCmd] deps: ', deps);

    const { stdout } = await sp('npm', this.rootDir, [
      'install',
      ...deps,
      '--save',
      '--json'
    ]);
    logger.debug(this.rootDir, 'stdout: ', stdout);
    return parseJson(stdout);
  }

  private resolveModuleIds(raw: string[]): { moduleId?: string, dir?: string, value: string }[] {
    return raw
      .map(r => {
        return { value: r, moduleId: this.moduleIdForPath(r) };
      })
      .map(i => {
        const dir = i.moduleId ? resolve(this.rootDir, 'node_modules', i.moduleId) : undefined;
        return { dir, ...i };
      });
  }
}
