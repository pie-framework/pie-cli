import { Viewer, KeyValue } from './index';
import { buildLogger } from '../log-factory';
import { existsSync, statSync } from 'fs-extra';
import { join, extname } from 'path';

const logger = buildLogger();

export default class LocalFile implements Viewer {

  constructor(private cwd: string) { }

  match(pattern: KeyValue): boolean {
    return (extname(pattern.value) && existsSync(join(this.cwd, pattern.value))) ? true : false;
  }

  view(pattern: KeyValue, property: string): Promise<any | undefined> {
    logger.info('[view], pattern: ', pattern, ' property: ', property);
    return Promise.resolve({});
  }
}