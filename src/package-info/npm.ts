import { Viewer, KeyValue } from './index';
import { buildLogger } from 'log-factory';
import * as semver from 'semver';

const logger = buildLogger();

const RegClient = require('npm-registry-client');

const client = new RegClient({});

let toRegistryPath = (pattern: KeyValue): string => {
  return encodeURI(`${pattern.key}/${pattern.value}`);
};

export class Npm implements Viewer {

  constructor() { }

  match(pattern: KeyValue): boolean {
    let match = pattern.value === '*' || semver.valid(pattern.value) !== null;
    logger.silly('[match] ', match, pattern);
    return match;
  }

  view(pattern: KeyValue, property: string): Promise<any | undefined> {

    logger.info('[view] pattern: ', pattern, ' property: ', property);

    return new Promise((resolve, reject) => {
      let path = toRegistryPath(pattern);
      client.get(`http://registry.npmjs.org/${path}`, { timeout: 1000 }, (err, data) => {
        if (err) {
          logger.debug('[view] err: ', err);
          resolve(undefined);
          return;
        } else {
          let out = data[property];
          logger.silly('[view] data: ', JSON.stringify(out, null, '  '));
          resolve(out);
        }
      });
    });
  }
}

export default new Npm();
