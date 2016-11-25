import { PieWatch, FileWatch } from './watchers';
import { buildLogger } from '../log-factory';
import * as _ from 'lodash';
import { pathIsDir } from '../npm/dependency-helper';
import { join } from 'path';

const logger = buildLogger();

//TODO: allow non pie packages to be watched?

export function init(questionConfig, reloadFn) {

  logger.debug('[init] questionConfig: ', questionConfig.localDependencies);

  let watchedDependencies = _(questionConfig.localDependencies).map((value, key) => {
    if (pathIsDir(questionConfig.dir, value)) {
      let w = new PieWatch(key, value, questionConfig.dir);
      w.start();
      return w;
    }
  }).compact().value();

  let configWatch = new FileWatch(
    join(questionConfig.dir, questionConfig.filenames.config), reloadFn);

  let markupWatch = new FileWatch(
    join(questionConfig.dir, questionConfig.filenames.markup), reloadFn);

  return {
    dependencies: watchedDependencies,
    config: configWatch,
    markup: markupWatch
  }
}