import * as webpack from 'webpack';
import { buildLogger } from '../log-factory';
import * as _ from 'lodash';
import DuplicateLoaders from './duplicate-loaders';
import { configToJsString } from './webpack-write-config';

const logger = buildLogger();

export type BuildResult = { stats: webpack.compiler.Stats, duration: number };

export function build(config): Promise<BuildResult> {

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
      } else if (stats.hasErrors()) {
        _.forEach((stats as any).compilation.errors, (e) => logger.error(e));
        reject(new Error('Webpack build errors - see the logs'));
      } else {
        let endTime = (stats as any).endTime;
        let startTime = (stats as any).startTime;
        let duration = endTime - startTime;
        logger.info(`webpack compile done. duration (ms): ${duration}`);
        resolve({ stats: stats, duration: duration });
      }
    });
  });
}