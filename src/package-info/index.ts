import * as _ from 'lodash';
import Local from './local';
import LocalFile from './local-file';
import npm from './npm';
import github from './github';
import { buildLogger } from '../log-factory';

const logger = buildLogger();

export interface Viewer {
  view(pattern: KeyValue, property: string): Promise<any | undefined>;
  match(pattern: KeyValue): boolean;
}

export type KeyValue = {
  key: string,
  value: string
}

export let info = (kv: KeyValue, property: string, cwd: string): Promise<any> => {

  logger.debug('[info] kv: ', kv, 'property: ', property, ' cwd: ', cwd);

  let viewers: Viewer[] = [
    new LocalFile(cwd),
    new Local(cwd),
    npm,
    github
  ];

  let compatible: Viewer[] = _.filter(viewers, v => v.match(kv));

  let out = _.reduce(compatible, (acc, v) => {
    logger.silly('[info] acc: ', acc);
    logger.silly('[info] v: ', v);
    return acc.then(r => {
      if (r !== undefined) {
        return r;
      } else {
        return v.view(kv, property);
      }
    });
  }, Promise.resolve(undefined));

  return out
    .catch(e => {
      logger.error(e);
      logger.error(e.stack);
      throw new Error(`unable to find info for package pattern: ${kv}`)
    });
}