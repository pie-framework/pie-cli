import * as webpack from 'webpack';
import { buildLogger } from 'log-factory';
import * as _ from 'lodash';
import { configToJsString } from './webpack-write-config';
import { writeConfig } from './webpack-write-config';
import { join, resolve } from 'path';

const logger = buildLogger();

export type BuildResult = { stats: webpack.compiler.Stats, duration: number };

export function build(config, dumpConfig?: string): Promise<BuildResult> {

  if (dumpConfig) {
    writeConfig(join(config.context, dumpConfig), config);
  }

  return new Promise((resolve, reject) => {

    webpack(config, (err, stats) => {
      if (err) {
        logger.error(err.message);
        reject(err);
      } else if (stats.hasErrors()) {

        let out = stats.toJson({ errorDetails: true });
        _.forEach(out.errors, (e) => logger.error(e));
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
