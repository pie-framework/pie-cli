import webpack from 'webpack';
import { buildLogger } from '../log-factory';
import _ from 'lodash';

const logger = buildLogger();

export function normalizeConfig(config) {
  return config;
}

export function build(config) {
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