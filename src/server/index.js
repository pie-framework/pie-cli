import { buildLogger } from '../log-factory';
import express from 'express';
import { join } from 'path';
import webpack from 'webpack';
import webpackMiddleware from 'webpack-dev-middleware';
import _ from 'lodash';
import jsesc from 'jsesc';

const logger = buildLogger();

export function make(configs, renderOpts, reloadFn) {

  logger.info('[make]');
  logger.silly('[make] configs:', configs);
  logger.silly('[make] renderOpts:', renderOpts);

  const params = _.extend(renderOpts, {
    model: jsesc(renderOpts.config)
  });

  const app = express();
  app.set('views', join(__dirname, 'views'));
  app.set('view engine', 'pug');

  let clientCompiler = webpack(configs.client);


  clientCompiler.plugin("done", function (stats) {
    process.nextTick(() => {
      logger.info('client - compilation is done!');
      reloadFn();
    });
  });

  let controllersCompiler = webpack(configs.controllers);
  controllersCompiler.plugin("done", function (stats) {
    process.nextTick(() => {
      logger.info('controllers - compilation is done!', app._onCompilationDoneHandler);
      reloadFn();
    });
  });

  let clientMiddleware = webpackMiddleware(clientCompiler, {
    publicPath: '/',
    noInfo: true
  });

  let controllersMiddleware = webpackMiddleware(controllersCompiler, {
    publicPath: '/',
    noInfo: true
  });

  app.use(clientMiddleware);
  app.use(controllersMiddleware);

  app.get('/', function (req, res) {
    res.render('example', params);
  });

  return app;
}