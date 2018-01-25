import * as _ from 'lodash';

import { Dirs, PieBuildInfo } from '../install';
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
  buildInfo: PieBuildInfo[],
  dirs: Dirs): {
    dependencies: Watch[],
    files: FileWatch[]
  } {

  logger.debug('[init] questionConfig: ', config.elements);

  const watchers: Watch[] = _(buildInfo).filter(bi => bi.isLocal).map(bi => {
    if (bi.controller) {
      return new PieWatch(
        bi.main.moduleId,
        config.dir,
        bi.src,
        dirs,
        {
          configure: bi.configure ? bi.configure.moduleId : undefined,
          controller: bi.controller.moduleId
        }
      );
    } else if (bi.isPackage) {
      return new PackageWatch(
        bi.element,
        bi.main.moduleId,
        config.dir
      );
    } else {
      return new FileWatch(join(config.dir, bi.main.moduleId), reloadFn);
    }
  }).value();

  logger.silly('watchers: ', watchers);

  _.forEach(watchers, (w) => w.start());

  config.filenames.resolveConfig(config.dir);
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
