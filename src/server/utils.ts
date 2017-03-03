import * as _ from 'lodash';
import * as express from 'express';
import * as http from 'http';

import { Compiler, Stats } from 'webpack';

import { ReloadOrError } from '../server/types';
import { buildLogger } from 'log-factory';

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


export function linkCompilerToServer(name, compiler: Compiler, handlers: ReloadOrError) {

  compiler.plugin('compile', (params) => {
    logger.info('The compiler is starting to compile...');
  });

  const onDone = (stats: Stats) => {
    logger.info('>> [compiler] done');

    process.nextTick(() => {
      if (stats.hasErrors()) {
        logger.error('recompile failed');
        let info = stats.toJson('errors-only');
        logger.error(info.errors);
        handlers.error(name, info.errors);
      } else {
        logger.debug(`${name}: reload!`);
        handlers.reload(name);
      }
    });
  };

  /**
   * TODO:  This shouldn't be necessary but something is causing webpack to recompile repeatedly.
   * For now we debounce the done handler.
   */
  const debouncedOnDone = _.debounce(onDone, 350, { leading: false, trailing: true });
  compiler.plugin('done', debouncedOnDone);
}
