import webpack from 'webpack';
import { buildLogger } from '../log-factory';
import _ from 'lodash';
import DuplicateLoaders from './duplicate-loaders';
import { configToJsString } from './webpack-write-config';

const logger = buildLogger();

export function build(config) {

  let duplicates = DuplicateLoaders.fromConfig(config);

  if (duplicates.present) {

    logger.error('This config has duplicate loaders:');
    logger.error(configToJsString(config));
    return Promise.reject(duplicates.error)
  }

  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) {
        logger.error(err.message);
        reject(err);
      }
      else if (stats.hasErrors()) {
        _.forEach(stats.compilation.errors, (e) => logger.error(e));
        reject(new Error('Webpack build errors - see the logs'));
      }
      else {
        logger.info(`webpack compile done. duration (ms): ${stats.endTime - stats.startTime}`);
        let duration = stats.endTime - stats.startTime;
        resolve({ stats: stats, duration: duration });
      }
    });
  });
}