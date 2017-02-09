import { Viewer, KeyValue } from './index';
import { buildLogger } from 'log-factory';
import { statSync, readJson } from 'fs-extra';
import { join } from 'path';

const logger = buildLogger();

export default class Local implements Viewer {

  constructor(private cwd: string) { }

  private pkgPath(pattern: KeyValue): string {
    return join(this.cwd, pattern.value, 'package.json');
  }

  match(pattern: KeyValue): boolean {
    let pkg = this.pkgPath(pattern);
    try {
      let stat = statSync(pkg);
      return stat.isFile();
    } catch (e) {
      return false;
    }
  }

  view(pattern: KeyValue, property: string): Promise<any | undefined> {

    logger.info('[view], pattern: ', pattern, ' property: ', property);
    if (!this.match(pattern)) {
      return Promise.resolve(undefined);
    } else {
      let pkg = this.pkgPath(pattern);
      return new Promise((resolve, reject) => {
        readJson(pkg, (err, data) => {
          if (err) {
            resolve(undefined);
            return;
          }
          logger.silly('[view] data: ', data);
          resolve(data[property]);
        });
      });
    }
  }
}