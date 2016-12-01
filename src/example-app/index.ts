"use strict";

import { join } from 'path';
import * as _ from 'lodash';
import * as pug from 'pug';
import * as jsesc from 'jsesc';
import { buildLogger } from '../log-factory';
import * as express from 'express';
import * as webpackMiddleware from 'webpack-dev-middleware';
import ExampleAppServer, { Server } from './server';
import { ElementDeclaration, Declaration } from '../code-gen/declaration';
import * as webpack from 'webpack';
import { Weight } from '../question/config/raw';
import { Config } from '../question/config';

const logger = buildLogger();

const templatePath = join(__dirname, 'views/example.pug');

logger.silly('[templatePath]: ', templatePath);

const pieController: Declaration = {
  key: 'pie-controller',
  js: `
        import Controller from 'pie-controller';
        window.pie = window.pie || {};
        window.pie.Controller = Controller;`
};

export interface App {
  entryJs: (defs: Declaration[]) => string;
  frameworkSupport: () => string[];
  dependencies: (branch: string) => { [key: string]: string };
  staticMarkup(paths, ids, config: Config): string;
  server: (compilers: {
    client: webpack.compiler.Compiler,
    controllers: webpack.compiler.Compiler
  }, paths, ids, config: Config) => Server;
}

export default class ExampleApp implements App {

  private _staticExample: pug.compileTemplate;
  private _server;

  constructor() {
    logger.debug('[Example] constructor');
    this._staticExample = pug.compileFile(templatePath, { pretty: true });
  }

  dependencies(branch: string = 'develop') {
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

  entryJs(defs: Declaration[]) {
    let defaults = [
      pieController,
      new ElementDeclaration('pie-player'),
      new ElementDeclaration('pie-control-panel')
    ];

    let all: Declaration[] = _.concat(defaults, defs);
    let initLogic = _.map(all, d => d.js).join('\n');

    return `
    if(!customElements){
      throw new Error('Custom Elements arent supported');
    }
    //
    ${initLogic}
    `;
  }

  staticMarkup(paths, ids, config: Config) {
    return this._staticExample({
      paths: paths,
      ids: ids,
      pieModels: jsesc(config.pieModels as any),
      weights: jsesc(config.weights as any),
      scoringType: config.scoringType,
      elementModels: jsesc(config.elementModels as any),
      markup: config.markup,
      langs: jsesc(config.langs as any)
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

  server(compilers, paths, ids, config: Config) {
    let app = this._mkApp(compilers, paths, ids, config);
    this._server = new ExampleAppServer(app);
    this._linkCompilerToServer('controllers', compilers.controllers, this._server);
    this._linkCompilerToServer('client', compilers.client, this._server);
    return this._server;
  }

  _mkApp(compilers, paths, ids, config: Config) {

    if (!paths) {
      throw new Error('paths must be defined');
    }

    //set the sock path
    paths.sock = ExampleAppServer.SOCK_PREFIX();

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
        paths: paths,
        ids: ids,
        pieModels: jsesc(config.pieModels as any),
        weights: jsesc(config.weights as any),
        scoringType: config.scoringType,
        langs: jsesc(config.langs as any),
        elementModels: jsesc(config.elementModels as any),
        markup: config.markup
      });
    });

    app.use(express.static(config.dir));

    return app;
  }
}
