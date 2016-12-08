import { Viewer, KeyValue } from './index';
import { buildLogger } from '../log-factory';
import { stat, statSync, readJson } from 'fs-extra';
import { join } from 'path';

const logger = buildLogger();

export default class Local implements Viewer {

  constructor(private cwd: string) { }

  match(pattern: KeyValue): boolean {
    let pkg = join(this.cwd, pattern.value, 'package.json');
    try {
      let stat = statSync(pkg);
      return stat.isFile();
    } catch (e) {
      return false;
    }
  }

  view(pattern: KeyValue, property: string): Promise<any | undefined> {
    logger.info('[view], pattern: ', pattern, ' property: ', property);
    return new Promise((resolve, reject) => {
      let pkg = join(this.cwd, pattern.value, 'package.json');

      logger.silly('[view] pkg: ', pkg);

      stat(pkg, (err, stat) => {
        if (err) {
          resolve(undefined);
        } else {
          if (!stat.isFile()) {
            logger.debug('stat.isFile? ', stat.isFile())
            resolve(undefined);
            return;
          }

          readJson(pkg, (err, data) => {
            if (err) {
              resolve(undefined);
              return;
            }
            logger.silly('[view] data: ', data);
            resolve(data[property]);
          });
        }
      });
    });
  }
}