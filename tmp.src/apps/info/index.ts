import * as express from 'express';
import { join, resolve } from 'path';
import { Server } from '../../server/types';
import * as http from 'http';
import * as fs from 'fs-extra';
import loadSchemas from './schema-loader';
import * as jsesc from 'jsesc';
import { buildLogger } from '../../log-factory';
import ExampleApp from '../example/index';
import { addView } from '../utils';

const logger = buildLogger();

class Wrapped implements Server {

  constructor(private underlying: http.Server) { }

  on(key, handler) {
    this.underlying.on(key, handler);
  }

  listen(port) {
    this.underlying.listen(port);
  }

  error(name, errors) {
    throw new Error('not supported');
  }

  reload(name) {
    throw new Error('not supported');
  }
}

export default class InfoApp {

  private _httpServer: http.Server;

  constructor(readonly dir: string, private demo: express.Router) { }

  router(): express.Router {

    const router = express.Router();

    let componentsDir = resolve(join(__dirname, 'bower_components'));

    logger.info('componentsDir: ', componentsDir);

    router.use('/components', express.static(componentsDir));

    let pkg = fs.readJsonSync(join(this.dir, 'package.json'));
    let readme = fs.readFileSync(join(this.dir, 'README.md'), 'utf8');
    let schemas = loadSchemas(join(this.dir, 'docs/schemas'));


    router.use('/demo', this.demo);

    router.get('/', (req, res, next) => {
      res.render('index', {
        pretty: true,
        name: pkg.name,
        version: pkg.version,
        repositoryUrl: pkg.repository.url,
        demo: '/demo',
        readme: jsesc(readme),
        schemas: schemas,
        pie: {
          url: '//github.com/PieLabs/pie-docs',
          logo: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTQsnQyrpApsRrY9KfGY--G9Og4_FQ1gLg3Iimx5_NedfCUevKQtQ'
        }
      });
    });

    return router;
  }

  server(app: express.Application): Server {
    logger.debug('app.get(views): ', app.get('views'));
    addView(app, join(__dirname, 'views'));
    app.use('/', this.router());
    this._httpServer = http.createServer(app);
    return new Wrapped(this._httpServer);
  }
}