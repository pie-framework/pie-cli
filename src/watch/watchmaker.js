import { PieWatch } from './watchers';
import { buildLogger } from '../log-factory';
import _ from 'lodash';

const logger = buildLogger();

export function init(questionConfig) {

  logger.debug('[init] questionConfig: ', questionConfig.localDependencies);

  return _.map(questionConfig.localDependencies, (value, key) => {
    let w = new PieWatch(key, value, questionConfig.dir);
    w.start();
    return w;
  });
}