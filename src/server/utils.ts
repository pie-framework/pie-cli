import * as _ from 'lodash';
import * as http from 'http';

import { Compiler, Stats } from 'webpack';

import { ReloadOrError } from './types';
import { buildLogger } from 'log-factory';
import report from '../cli/report';

const logger = buildLogger();

export let startServer = (port: number, server: http.Server) => new Promise((resolve, reject) => {
  server.on('error', (e) => {
    logger.error(e.message);
    logger.debug(e.stack);
    reject(e);
  });

  server.on('listening', () => {
    logger.silly(`[startServer] listening on ${port}`);
    resolve(server);
  });

  server.listen(port);
});


export function linkCompilerToServer(name: string,
  compiler: Compiler,
  handlers: ReloadOrError) {

  //  TODO: would be nice to call report.indeterminate here ...
  const onCompile = (params) => {
    logger.info('The compiler is starting to compile...');
    report.info('Webpack re-compiling...');
  };

  const onDone = (stats: Stats) => {
    logger.info('>> [compiler] done');

    process.nextTick(() => {
      if (stats.hasErrors()) {
        logger.error('recompile failed');
        report.failure('webpack compilation failed');
        const json = stats.toJson('errors-only');
        logger.error(json.errors);
        handlers.error(name, json.errors);
      } else {
        logger.debug(`${name}: reload!`);
        report.success('Webpack recompile successful');
        handlers.reload(name);
      }
    });
  };

  /**
   * TODO:  This shouldn't be necessary but something is causing webpack to recompile repeatedly.
   * For now we debounce the done handler.
   */
  const debounceOpts = { leading: false, trailing: true };
  compiler.plugin('compile', _.debounce(onCompile, 350, debounceOpts));
  const debouncedOnDone = _.debounce(onDone, 350, debounceOpts);
  compiler.plugin('done', debouncedOnDone);
}
