import { PieWatch } from './watchers';
import { buildLogger } from '../log-factory';
import _ from 'lodash';
import { pathIsDir } from '../npm/dependency-helper';

const logger = buildLogger();

//TODO: allow non pie packages to be watched?

export function init(questionConfig) {

  logger.debug('[init] questionConfig: ', questionConfig.localDependencies);

  return _(questionConfig.localDependencies).map((value, key) => {
    if (pathIsDir(questionConfig.dir, value)) {
      let w = new PieWatch(key, value, questionConfig.dir);
      w.start();
      return w;
    }
  }).compact().value();
}