import * as fs from 'fs-extra';
import * as glob from 'glob';
import * as  _ from 'lodash';
import { buildLogger } from '../../log-factory';
const logger = buildLogger();

export default (dir: string) => {
  logger.info(`load schemas in path: ${dir}`);
  let files = glob.sync(`${dir}/**/*.json`);
  logger.debug('files:', files);
  return _.map(files, (f) => fs.readJsonSync(f));
}