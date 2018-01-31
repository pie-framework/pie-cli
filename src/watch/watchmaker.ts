import * as _ from 'lodash';

import { Dirs, Pkg, PackageType } from '../install';
import { FileWatch, PackageWatch, PieWatch, Watch } from './watchers';

import { JsonConfig } from '../question/config';
import { buildLogger } from 'log-factory';
import { join } from 'path';

const logger = buildLogger();

type ReloadFn = (n: string) => void;

export function init(
  config: JsonConfig,
  reloadFn: ReloadFn,
  extraFilesToWatch: string[],
  pkgs: Pkg[],
  dirs: Dirs): {
    dependencies: Watch[],
    files: FileWatch[]
  } {

  logger.debug('[init] questionConfig: ', config.elements);

  const watchers: Watch[] = _(pkgs)
    .filter(p => p.isLocal)
    .map(p => {
      if (p.controller) {
        return new PieWatch(
          p.element,
          p.rootModuleId,
          config.dir,
          p.input.value,
          dirs,
          p.controller,
          p.configure);
      } else if (p.type === PackageType.PACKAGE) {
        return new PackageWatch(
          p.rootModuleId,
          p.input.value,
          config.dir
        );
      } else {
        return new FileWatch(join(config.dir, p.rootModuleId), reloadFn);
      }
    }).value();

  logger.silly('watchers: ', watchers);

  _.forEach(watchers, (w) => w.start());

  const allFiles = [
    config.filenames.resolveConfig(config.dir),
    join(config.dir, config.filenames.markup)
  ].concat(extraFilesToWatch || []);

  const fileWatches = allFiles.map((p) => {
    logger.silly(`FileWatch for ${p}`);
    const fw = new FileWatch(p, reloadFn);
    fw.start();
    return fw;
  });

  return {
    dependencies: watchers,
    files: fileWatches
  };
}
