import * as _ from 'lodash';

import { install, InstalledElement, PackageType, Dirs } from '@pie-cli-libs/installer';
import { ElementDeclaration } from '../code-gen';
import { PieTarget } from './common';
import { RawConfig } from '../question/config';
import { buildLogger } from 'log-factory';
import report from '../cli/report';

export {
  Dirs
};

const logger = buildLogger();

export { PieTarget };

export type Mappings = {
  controllers: PieTarget[],
  configure: PieTarget[]
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
      dir: isPackage && ie.postInstall ? ie.postInstall.dir : rootDir,
      moduleId: isPackage && ie.postInstall ? ie.postInstall.moduleId : ie.preInstall.value,
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

export type InstallResult = {
  dirs: Dirs,
  buildInfo: PieBuildInfo[]
};

export default class Install {

  constructor(private rootDir: string, private config: RawConfig) { }

  public async install(force: boolean = false): Promise<InstallResult> {
    const result: { dirs: Dirs, installed: InstalledElement[] } =
      await install(this.rootDir, this.config.elements, this.config.models, report);
    const buildInfo = _.map(result.installed, r => toPieBuildInfo(this.rootDir, r));

    return {
      buildInfo,
      dirs: result.dirs
    };
  }

}
