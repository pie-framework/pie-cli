import * as _ from 'lodash';
import { buildLogger } from 'log-factory';
import { writeFileSync } from 'fs-extra';
import { join } from 'path';
import { hash as mkHash } from '@pie-cli-libs/hash';
import {
  install,
  Dirs,
  Pkg,
  PieConfigure,
  PieController,
  PackageType,
  Element,
  InstallResult
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

const findResolution = (
  result: InstallResult,
  value: string
): string | undefined => {
  // const lockFile = result.lockFiles.root;
  logger.info('[findResolution]...');
  const out = result.lockFiles.root[value];
  if (out === undefined) {
    return;
  }
  return out.version;
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

      const info = result.pkgs.map(p => {
        const resolved = findResolution(result, p.input.value);
        return {
          pie: p.rootModuleId,
          version: {
            requested: p.input.version,
            resolved
          }
        };
      });

      const hash = mkHash(
        info.map(i => ({ name: i.pie, version: i.version.resolved }))
      );

      const manifest = {
        hash,
        info
      };

      writeFileSync(
        join(this.rootDir, 'pie.manifest.json'),
        JSON.stringify(manifest, null, '  ')
      );

      resolve(null);
    });
  }
}
