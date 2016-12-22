import * as bower from 'bower';
import { buildLogger } from '../../../log-factory';
import * as _ from 'lodash';

const logger = buildLogger();

let bowerLogHandler = (label, log) => {
  if (_.includes(['action', 'info'], log.level)) {
    logger.silly(label, log.id, log.message);
  }
};

export let install = (dir: string, deps: string[]): Promise<any> => {
  return new Promise((resolve, reject) => {
    let bowerLogger = bower.commands.install(deps, { save: false }, { cwd: dir });
    bowerLogger
      .on('log', bowerLogHandler.bind(null, '[install]'))
      .on('error', (e) => {
        logger.error('error for dir: ', dir, e);
        reject(e);
      })
      .on('end', (installed) => {
        logger.debug(`[install] ${this} - complete`);
        resolve(installed);
      });
  });
}