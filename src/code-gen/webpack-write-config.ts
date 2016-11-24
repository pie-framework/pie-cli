import {fileLogger} from '../log-factory';
import fs from 'fs-extra';
import path from 'path';

let logger = fileLogger(__filename);

export function configToJsString(config){
  let json = JSON.stringify(config, (key, value) => {
    if (value instanceof RegExp) {
      return '<RE>' + value.source + '</RE>';
    } else {
      return value;
    }
  }, '  ');

  let tweaked = json
    .replace(/"<RE>(.*?)<\/RE>"/g, '/$1/')
    .replace(/\\\\/g, '\\');

  return ` 
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