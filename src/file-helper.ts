import * as _ from 'lodash';
import * as path from 'path';
import * as fs from 'fs-extra';
import { existsSync, writeFile } from 'fs-extra';
import { buildLogger } from './log-factory';

const logger = buildLogger();

export function removeFilePaths(files: string[]): Promise<string[]> {
  let promises = _.map(files, (f) => new Promise((resolve, reject) => {
    logger.silly(`remove filepath: ${f}`);
    return fs.remove(f, (err) => err ? reject(err) : resolve(f));
  }));
  return Promise.all(promises)
    .then((results) => {
      logger.silly(`removed: ${_.map(results, (f: string) => path.basename(f)).join("\n")}`);
      return results;
    });
}

export function removeFiles(root, files) {
  let filePaths = _.map(files, f => path.join(root, f));
  return removeFilePaths(filePaths);
}

export function softWrite(path, src) {
  if (existsSync(path)) {
    return Promise.resolve(path);
  } else {
    return new Promise((resolve, reject) => {
      writeFile(path, src, 'utf8', (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(path);
        }
      });
    });
  }
}
