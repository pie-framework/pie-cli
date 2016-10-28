import { buildLogger } from '../log-factory';
import express from 'express';
import { join } from 'path';

const logger = buildLogger();

export function make(configs, controllersUid) {
  logger.info('start');

  const app = express();
  app.set('views', join(__dirname, 'views'));
  app.set('view engine', 'pug');
  // respond with "hello world" when a GET request is made to the homepage
  app.get('/', function (req, res) {
    res.render('example', { title: 'hi', message: 'message...' });
  });



  return app;
}