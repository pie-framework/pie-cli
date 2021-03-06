import * as fs from 'fs-extra';
import * as path from 'path';

import { fileLogger } from 'log-factory';

const logger = fileLogger(__filename);

export function configToJsString(config) {
  const json = JSON.stringify(config, (key, value) => {
    if (value instanceof RegExp) {
      return '<RE>' + value.source + '</RE>';
    } else {
      return value;
    }
  }, '  ');

  const tweaked = json
    .replace(/"<RE>(.*?)<\/RE>"/g, '/$1/')
    .replace(/\\\\/g, '\\');

  return ` 
  //auto generated on: ${new Date().toString()}
  
  module.exports = ${tweaked};
  `;
}

export function writeConfig(filepath, config) {
  logger.debug('write config to: ', filepath);
  fs.ensureDirSync(path.dirname(filepath));
  logger.debug('just writing out the webpack config');

  let js = configToJsString(config);
  fs.writeFileSync(filepath, js, { encoding: 'utf8' });
}