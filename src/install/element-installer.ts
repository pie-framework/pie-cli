import * as _ from 'lodash';
import * as semver from 'semver';

import { ensureDirSync, existsSync, statSync } from 'fs-extra';
import { join, resolve } from 'path';

import Npm from '../npm';
import { buildLogger } from 'log-factory';
import { matchInstallDataToRequest } from '../npm/module-identifier';

export enum PackageType {
  FILE = 'file',
  PACKAGE = 'package'
}

export type Input = {
  element: string,
  value: string
};

export type PreInstallRequest = {
  element: string,
  value: string,
  local: boolean,
  type: PackageType,
  hasModel: boolean
};

export type NpmInstall = {
  version: string,
  from: string,
  resolve: string,
  dir: string,
  moduleId: string
};

export type PieInfo = {
  hasConfigurePackage: boolean,
  controller?: { dir: string, moduleId: string },
  configure?: { dir: string, moduleId: string }
};

export interface InstalledElement {
  element: string;
  input: Input;
  preInstall: PreInstallRequest;
  npmInstall?: NpmInstall;
  pie?: PieInfo;
}

const logger = buildLogger();

export interface ElementInstaller {
  install(elements: { [key: string]: string }, models: { element: string }[]): Promise<InstalledElement[]>;
}

export default class DefaultInstaller implements ElementInstaller {

  // tslint:disable-next-line:member-access
  readonly installationDir: string;

  constructor(private cwd: string) {
    this.installationDir = join(cwd, '.pie');
    ensureDirSync(this.installationDir);
  }

  public async install(elements: { [key: string]: string; },
    models: { element: string }[]): Promise<InstalledElement[]> {

    logger.silly('[install]', elements);

    const keyValues: Input[] = _.map(elements, (value, element) => ({ element, value }));
    const requests: PreInstallRequest[] = this.createInstallRequests(keyValues, models);
    const results: NpmInstall[] = await this.runNpmInstall(requests);

    const data: InstalledElement[] = _.zipWith(keyValues, requests, results, (kv, req, res) => {
      const out: any = {
        element: kv.element,
        input: kv,
        npmInstall: res,
        preInstall: req
      };
      out.pie = this.addPieInfo(out);
      return out;
    });

    logger.silly('data:', JSON.stringify(data, null, '  '));
    return data;
  }

  private addPieInfo(data: { npmInstall: NpmInstall }): PieInfo | undefined {

    const { npmInstall } = data;
    if (npmInstall && npmInstall.moduleId) {
      const installedPath = join(npmInstall.dir, 'node_modules', npmInstall.moduleId);
      const hasController = existsSync(join(installedPath, 'controller')) &&
        existsSync(join(installedPath, 'controller', 'package.json'));
      const hasConfigurePackage = existsSync(join(installedPath, 'configure')) &&
        existsSync(join(installedPath, 'configure', 'package.json'));
      if (hasController) {
        return { hasConfigurePackage };
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  private createInstallRequests(
    elements: { element: string, value: string }[],
    models: { element: string }[]): PreInstallRequest[] {
    return elements.map(({ element, value }) => {
      const resolvedPath = resolve(this.cwd, value);

      logger.silly('resolvedPath: ', resolvedPath);

      if (existsSync(resolvedPath)) {
        const stat = statSync(resolvedPath);
        // Note: we must create a relative path from .pie to the element, so we add ..
        const relativePath = `../${value}`;

        return {
          element,
          hasModel: _.some(models, m => m.element === element),
          local: true,
          type: stat.isFile() ? PackageType.FILE : PackageType.PACKAGE,
          value: relativePath,
        };
      } else {
        const v = semver.validRange(value) ? `${element}@${value}` : value;
        return {
          element,
          hasModel: _.some(models, m => m.element === element),
          local: false,
          type: PackageType.PACKAGE,
          value: v
        };
      }
    });
  }

  private async runNpmInstall(requests: PreInstallRequest[]): Promise<NpmInstall[]> {

    const npm = new Npm(this.installationDir);

    const groups = _.groupBy(requests, r => r.type);

    logger.silly('[runNpmInstall] groups: ', groups);

    const packages = groups[PackageType.PACKAGE];

    const result = await npm.installIfNeeded(packages.map(p => p.value));

    return requests.map(req => {

      const match = matchInstallDataToRequest(req.value, result);

      if (match) {
        const { moduleId, data } = match;
        delete data.dependencies;
        return {
          ...data,
          dir: this.installationDir,
          moduleId
        };
      }
    });
  }
}
