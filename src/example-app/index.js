import { join } from 'path';
import _ from 'lodash';
import pug from 'pug';
import jsesc from 'jsesc';
import { buildLogger } from '../log-factory';
import express from 'express';
import webpackMiddleware from 'webpack-dev-middleware';
import http from 'http';
import sockjs from 'sockjs';

const logger = buildLogger();

const templatePath = join(__dirname, 'views/example.pug');

logger.silly('[templatePath]: ', templatePath);


const pieController = {
  key: 'pie-controller',
  initSrc: `
        import Controller from 'pie-controller';
        window.pie = window.pie || {};
        window.pie.Controller = Controller;`
};

let defineCustomElement = (p, index) => `
  import comp${index} from '${p}';
  //customElements v1 
  customElements.define('${p}', comp${index});
  `;

let writeInitLogic = (p, index) => {
  if (p.hasOwnProperty('initSrc')) {
    return p.initSrc;
  }
  else {
    return defineCustomElement(p, index);
  }
};

export default class ExampleApp {

  constructor() {
    logger.debug('[Example] constructor');
    this._staticExample = pug.compileFile(templatePath, { pretty: true });
  }

  dependencies(branch = 'develop') {
    return {
      'pie-controller': `PieLabs/pie-controller#${branch}`,
      'pie-player': `PieLabs/pie-player#${branch}`,
      'pie-control-panel': `PieLabs/pie-control-panel#${branch}`
    }
  }

  frameworkSupport() {
    return [
      join(__dirname, '../framework-support/frameworks/react'),
      join(__dirname, '../framework-support/frameworks/less')
    ]
  }

  entryJs(elementNames) {

    let all = _.concat([pieController, 'pie-player', 'pie-control-panel'], elementNames);
    let initLogic = _.map(all, writeInitLogic).join('\n');

    return `
    if(!customElements){
      throw new Error('Custom Elements arent supported');
    }
    //
    ${initLogic}
    `;
  }

  staticMarkup(paths, ids, markup, model) {
    let escapedModel = jsesc(model);
    return this._staticExample({
      paths: paths,
      ids: ids,
      model: escapedModel,
      markup: markup
    });
  };

  _linkCompilerToServer(name, compiler, handlers) {
    compiler.plugin('done', (stats) => {
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
    });
  }

  server(compilers, opts) {
    opts.paths.sock = ExampleAppServer.SOCK_PREFIX();
    let app = this._mkApp(compilers, opts);
    this._server = new ExampleAppServer(app);
    this._linkCompilerToServer('controllers', compilers.controllers, this._server);
    this._linkCompilerToServer('client', compilers.client, this._server);
    return this._server;
  }

  _mkApp(compilers, opts) {

    if (!opts || !opts.paths) {
      throw new Error('opts and opts.paths must be defined');
    }

    //set the sock path
    opts.paths.sock = ExampleAppServer.SOCK_PREFIX();

    const app = express();

    app.set('views', join(__dirname, 'views'));
    app.set('view engine', 'pug');

    let clientMiddleware = webpackMiddleware(compilers.client, {
      publicPath: '/',
      noInfo: true
    });

    app.use(clientMiddleware);

    let controllersMiddleware = webpackMiddleware(compilers.controllers, {
      publicPath: '/',
      noInfo: true
    });

    app.use(controllersMiddleware);

    app.get('/', (req, res) => {
      res.render('example-with-sock', {
        paths: opts.paths,
        ids: opts.ids,
        model: jsesc(opts.model()),
        markup: opts.markup()
      });
    });

    return app;
  }

}

class ExampleAppServer {

  static SOCK_PREFIX() {
    return '/sock'
  };

  static SOCK_JS_URL() {
    return '//cdn.jsdelivr.net/sockjs/1.0.1/sockjs.min.js';
  }

  constructor(app, sockJsUrl = ExampleAppServer.SOCK_JS_URL()) {
    this._httpServer = http.createServer(app);
    this._sockServer = sockjs.createServer({
      sockjs_url: sockJsUrl
    });

    this._sockServer.on('connection', (conn) => {

      logger.silly('[ExampleAppServer] on - connection: ', (typeof conn));
      if (!conn) {
        return;
      }
      this._connection = conn;
    });

    this._sockServer.installHandlers(
      this._httpServer,
      { prefix: ExampleAppServer.SOCK_PREFIX() }
    );
  }

  on(key, handler) {
    this._httpServer.on(key, handler);
  }

  listen(port) {
    this._httpServer.listen(port);
  }

  reload(name) {
    logger.debug('[ExampleAppServer] reload: name:', name);
    logger.silly('[ExampleAppServer] reload: connection', (typeof this._connection));
    if (this._connection) {
      this._connection.write(JSON.stringify({ type: 'reload' }));
    }
  }

  error(name, errors) {
    logger.debug('[ExampleAppServer] error: name:', name);
    logger.silly('[ExampleAppServer] error: connection: ', (typeof this._connection));
    if (this._connection) {
      this._connection.write(JSON.stringify({ type: 'error', errors: errors }));
    }
  }
}