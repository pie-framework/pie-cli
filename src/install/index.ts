import * as _ from 'lodash';
import { buildLogger } from 'log-factory';

import {
  install,
  Dirs,
  Pkg,
  PieConfigure,
  PieController,
  PackageType,
  Element
} from '@pie-cli-libs/installer';
import { ElementDeclaration } from '../code-gen';
import { PieTarget } from './common';
import { RawConfig } from '../question/config';
import report from '../cli/report';

export { Dirs, PackageType, Pkg, PieConfigure, PieController, Element };

export { PieTarget };

const logger = buildLogger();

export type Mappings = {
  controllers: PieTarget[];
  configure: PieTarget[];
};

export const controllerTargets = (pkgs: Pkg[]): PieTarget[] =>
  toTargets('controller', pkgs);

export const configureDeclarations = (pkgs: Pkg[]): ElementDeclaration[] => {
  return pkgs.filter(bi => bi.configure).map(bi => {
    return new ElementDeclaration(`${bi.configure.tag}`, bi.configure.moduleId);
  });
};

export const pieToConfigureMap = (
  pkgs: Pkg[] = []
): { [key: string]: string } => {
  return pkgs.reduce((acc, p) => {
    if (p.configure) {
      return { ...acc, [p.element.tag]: p.configure.tag };
    } else {
      return acc;
    }
  }, {});
};

export const toDeclarations = (pkgs: Pkg[]): ElementDeclaration[] => {
  return pkgs.map(
    bi => new ElementDeclaration(bi.element.tag, bi.element.moduleId)
  );
};

const toTargets = (
  key: 'controller' | 'configure',
  pkgs: Pkg[]
): PieTarget[] => {
  return _(pkgs)
    .filter(bi => bi[key])
    .map(bi => ({ pie: (bi as any).element.tag, target: bi[key].moduleId }))
    .value();
};

export type InstallResult = {
  dirs: Dirs;
  pkgs: Pkg[];
};

export default class Install {
  constructor(private rootDir: string, private config: RawConfig) {}

  public async install(force: boolean = false): Promise<InstallResult> {
    const result = await install(
      this.rootDir,
      this.config.elements,
      this.config.models,
      report
    );

    await this.writeManifest(result);
    return result;
  }

  private writeManifest(result: InstallResult): Promise<void> {
    return new Promise((resolve, reject) => {
      logger.info('write out a manifest.', result);

      result.pkgs.map(p => {
        const resolvedVersion = findResolution(result.lock, p.rootModuleId);
        const requestedVersion = p.input.version;
        return {
          pie: p.rootModuleId,
          resolved: resolvedVersion,
          requested: requestedVersion
        };
      });
      resolve(null);
    });
  }
}
