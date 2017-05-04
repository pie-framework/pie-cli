import * as _ from 'lodash';
import * as webpack from 'webpack';

import { buildLogger } from 'log-factory';
import { join } from 'path';
import { writeConfig } from './webpack-write-config';

// tslint:disable-next-line:no-var-requires
const stripAnsi = require('strip-ansi');

const logger = buildLogger();


export type BuildResult = { stats: webpack.compiler.Stats, duration: number };

/**
 * The name of the log file that may be checked for errors.
 */
let logFile: string;

export function setLogFile(name: string) {
  logFile = name;
}

export const RERUN = (name: string) => `re-run the command with \`--logFile ${name}\` to see the error details`;

export const SEE_FILE = (name: string) => `see the file: ${name} to see the error details`;

export function build(config: webpack.Configuration, dumpConfig?: string): Promise<BuildResult> {

  if (dumpConfig) {
    writeConfig(join(config.context, dumpConfig), config);
  }

  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) {
        logger.error(err.message);
        reject(err);
      } else if (stats.hasErrors()) {

        const includeColor = logFile === undefined;
        const errors = stats.toString({ errorDetails: true, colors: false });
        logger.error(includeColor ? errors : stripAnsi(errors));
        const supplemental = logFile ? SEE_FILE(logFile) : RERUN('out.log');
        reject(new Error(`Webpack build errors - ${supplemental}`));
      } else {
        const endTime = (stats as any).endTime;
        const startTime = (stats as any).startTime;
        const duration = endTime - startTime;
        logger.info(`webpack compile done. duration (ms): ${duration}`);
        resolve({ stats, duration });
      }
    });
  });
}
