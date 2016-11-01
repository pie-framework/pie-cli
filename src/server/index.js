import { buildLogger } from '../log-factory';
import express from 'express';
import { join } from 'path';
import webpackMiddleware from 'webpack-dev-middleware';
import _ from 'lodash';
import jsesc from 'jsesc';

const logger = buildLogger();

//TODO: reload on config or markup change
export function make(compilers, renderOpts) {

  logger.info('[make]');
  logger.silly('[make] renderOpts:', renderOpts);

  const app = express();

  app.set('views', join(__dirname, 'views'));
  app.set('view engine', 'pug');

  let clientMiddleware = webpackMiddleware(compilers.client, {
    publicPath: '/',
    noInfo: true
  });

  let controllersMiddleware = webpackMiddleware(compilers.controllers, {
    publicPath: '/',
    noInfo: true
  });

  app.use(clientMiddleware);
  app.use(controllersMiddleware);

  app.get('/', function (req, res) {

    const params = _.extend(renderOpts, {
      model: jsesc(renderOpts.questionConfig.readConfig()),
      markup: renderOpts.questionConfig.readMarkup()
    });

    res.render('example-with-sock', params);
  });

  return app;
}