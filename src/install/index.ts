import * as _ from 'lodash';

import ElementInstaller, { InstalledElement, PackageType } from './element-installer';
import { join, relative, resolve } from 'path';

import { ElementDeclaration } from '../code-gen';
import Npm from '../npm';
import { PieTarget } from './common';
import { RawConfig } from '../question/config';
import { buildLogger } from 'log-factory';
import { ensureDir } from 'fs-extra';
import report from '../cli/report';

const logger = buildLogger();

export { PieTarget };

export type Mappings = {
  controllers: PieTarget[],
  configure: PieTarget[]
};

export type Dirs = {
  configure: string,
  controllers: string,
  root: string
};

export type Controller = {
  dir: string,
  moduleId: string
};

export type PieBuildInfo = {
  configure?: Element,
  controller?: Controller,
  element: string,
  isLocal: boolean,
  isPackage: boolean,
  main: Element,
  src: string
};

export type Element = {
  dir: string,
  tag: string,
  moduleId: string
};

export const controllerTargets = (buildInfo: PieBuildInfo[]): PieTarget[] => toTargets('controller', buildInfo);
export const configureDeclarations = (buildInfo: PieBuildInfo[]): ElementDeclaration[] => {
  return buildInfo.filter(bi => bi.configure).map(bi => {
    return new ElementDeclaration(`${bi.element}-configure`, bi.configure.moduleId);
  });
};

export const pieToConfigureMap = (buildInfo: PieBuildInfo[]): { [key: string]: string } => {
  if (!buildInfo) {
    return {};
  }

  return buildInfo.reduce((acc, bi) => {
    acc[bi.element] = `${bi.element}-configure`;
    return acc;
  }, {});
};

export const toDeclarations = (buildInfo: PieBuildInfo[]): ElementDeclaration[] => {
  return buildInfo.map(bi => new ElementDeclaration(bi.main.tag, bi.main.moduleId));
};

const toTargets = (key: 'controller' | 'configure', buildInfo: PieBuildInfo[]): PieTarget[] => {
  return _(buildInfo)
    .filter(bi => bi[key])
    .map(bi => ({ pie: bi.element, target: bi[key].moduleId }))
    .value();
};

const toPieBuildInfo = (rootDir: string, ie: InstalledElement): PieBuildInfo => {
  const isPackage = ie.preInstall.type === PackageType.PACKAGE;
  logger.silly('[toPieBuildInfo] element: ', ie.element, JSON.stringify(ie, null, '  '));

  const out: PieBuildInfo = {
    element: ie.element,
    isLocal: ie.preInstall.local,
    isPackage,
    main: {
      dir: isPackage && ie.npmInstall ? ie.npmInstall.dir : rootDir,
      moduleId: isPackage && ie.npmInstall ? ie.npmInstall.moduleId : ie.preInstall.value,
      tag: ie.element
    },
    src: ie.input.value,
  };

  if (ie.pie && ie.pie.controller) {
    out.controller = {
      dir: ie.pie.controller.dir,
      moduleId: ie.pie.controller.moduleId,
    };
  }

  if (ie.preInstall.hasModel && (!ie.pie || !ie.pie.controller)) {

    /**
     * For elements that have no controller but have a model in the config,
     * we assign the `pie-controller/lib/passthrough` controller which just
     * allows the model to pass through it.
     */
    out.controller = {
      dir: '?',
      moduleId: 'pie-controller/lib/passthrough'
    };
  }

  if (ie.pie && ie.pie.configure) {
    out.configure = {
      dir: ie.pie.configure.dir,
      moduleId: ie.pie.configure.moduleId,
      tag: `${ie.element}-configure`,
    };
  }
  logger.silly('[toPieBuildInfo] out: ', ie.element, JSON.stringify(out, null, '  '));
  return out;
};

export const findModuleId = (
  parentId: string,
  rd: { moduleId: string, path: string }[],
  deps: { [key: string]: any }) => {
  logger.silly('[findModuleId]:', parentId);
  const path = _.find(rd, d => d.moduleId === parentId).path;
  const zipped = _.map(deps, (o, moduleId) => ({ data: o, moduleId }));
  const out = _.find(zipped, ({ data, moduleId }) => {
    const eql = data.from === path;
    logger.silly('[findModuleId]:', parentId, 'data:', JSON.stringify(data));
    logger.silly('[findModuleId]:', parentId, 'path:', path, 'data:', data.from, 'eql:', eql);
    return eql;
  });
  logger.silly('[findModuleId]: out: ', out);
  return out.moduleId;
};

export default class Install {

  // tslint:disable-next-line:member-access
  readonly dir: string;
  private elementInstaller: ElementInstaller;

  get dirs(): Dirs {
    return {
      configure: resolve(join(this.dir, '.configure')),
      controllers: resolve(join(this.dir, '.controllers')),
      root: this.dir
    };
  }

  constructor(private rootDir: string, private config: RawConfig) {
    this.elementInstaller = new ElementInstaller(this.rootDir);
    this.dir = this.elementInstaller.installationDir;
  }

  public async install(force: boolean = false): Promise<PieBuildInfo[]> {
    const result = await report.promise(
      'installing root package',
      this.elementInstaller.install(this.config.elements, this.config.models));

    logger.info('[install] result:', result);

    const controllerResult: any = await report.promise('installing controllers', this.installControllers(result));

    if (controllerResult instanceof Error) {
      throw controllerResult;
    }

    const configureResult = await report.promise('installing configure', this.installConfigure(result));

    if (configureResult instanceof Error) {
      throw configureResult;
    }

    logger.silly('configureResult: ', configureResult, configureResult instanceof Error, typeof configureResult);
    logger.silly('updated result: ', JSON.stringify(result, null, ' '));

    return _.map(result, r => toPieBuildInfo(this.dirs.root, r));
  }

  private async installConfigure(result: InstalledElement[]): Promise<any> {
    const pies = result.filter(r => r.pie !== undefined && r.pie.hasConfigurePackage);
    return this.installPieSubPackage(pies, 'configure', this.dirs.configure);
  }

  private async installControllers(result: InstalledElement[]): Promise<any> {
    const pies = result.filter(r => r.pie !== undefined);
    return this.installPieSubPackage(pies, 'controller', this.dirs.controllers);
  }

  private async installPieSubPackage(pies: InstalledElement[],
    packageName: 'controller' | 'configure',
    installDir: string): Promise<any> {

    logger.silly('[installPieSubPackage] pies: ', pies);

    if (!pies || pies.length === 0) {
      return;
    }

    const relativeDependencies = pies.map(p => {
      if (!p.npmInstall) {
        throw new Error('we expect an npm install object for a pie');
      }
      const postInstall = p.npmInstall;
      const installPath = join(postInstall.dir, 'node_modules', postInstall.moduleId, packageName);
      return { moduleId: postInstall.moduleId, path: relative(installDir, installPath) };
    });

    await ensureDir(installDir);

    const npm = new Npm(installDir);

    const installResult = await npm.installIfNeeded(relativeDependencies.map(r => r.path));

    logger.silly('[installPieSubPackage] installResult', installResult);
    pies.forEach(p => {
      if (p.pie) {
        p.pie[packageName] = {
          dir: installDir,
          moduleId: findModuleId(p.npmInstall.moduleId, relativeDependencies, installResult)
        };
      }
    });
    logger.silly('[installPieSubPackage]: ', JSON.stringify(installResult, null, '  '));
    return installResult;
  }
}
