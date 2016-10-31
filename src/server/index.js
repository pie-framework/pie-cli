import { buildLogger } from '../log-factory';
import express from 'express';
import { join } from 'path';
import webpack from 'webpack';
import webpackMiddleware from 'webpack-dev-middleware';
import _ from 'lodash';
import jsesc from 'jsesc';

const logger = buildLogger();

export function make(configs, renderOpts) {

  logger.info('[make]');
  logger.silly('[make] configs:', configs);
  logger.silly('[make] renderOpts:', renderOpts);

  const params = _.extend(renderOpts, {
    model: jsesc(renderOpts.config)
  });

  const app = express();
  app.set('views', join(__dirname, 'views'));
  app.set('view engine', 'pug');

  app.use(webpackMiddleware(webpack(configs.client), {
    publicPath: '/'
  }));

  app.use(webpackMiddleware(webpack(configs.controllers), {
    publicPath: '/'
  }));

  app.get('/', function (req, res) {
    res.render('example', params);
  });

  return app;
}