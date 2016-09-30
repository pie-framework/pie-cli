import _ from 'lodash';
import path from 'path';
import fs from 'fs-extra';


import {fileLogger} from './log-factory';

const logger = fileLogger(__filename);

export function removeFiles(root, files){ 
  let promises = _.map(files, (f) => new Promise((resolve, reject) => {
    let filepath = path.join(root, f);
    fs.remove(filepath, (err) => err ? reject(err) : resolve(filepath));
  }));
  return Promise.all(promises)
    .then((results) => {
      logger.info(`removed: ${_.map(results, (f) => path.basename(f)).join("\n")}`);
      return results;
    });
}