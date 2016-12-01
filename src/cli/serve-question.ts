import { buildLogger } from '../log-factory';
import Question from '../question';
import CliCommand from './cli-command';
import { resolve } from 'path';
import * as watchMaker from '../watch/watchmaker';
import * as webpack from 'webpack';
import ExampleApp, { App } from '../example-app';
import { Server } from '../example-app/server';
import tmpSupport from './tmp-support';
import { ReloadableConfig } from '../question/config';


const logger = buildLogger();

export class ServeQuestionOpts {
  constructor(readonly dir, readonly clean, readonly port) {
  }

  static build(args) {
    args = args || {};
    return new ServeQuestionOpts(
      args.dir || process.cwd(),
      args.clean === 'true' || args.clean === true || false,
      args.port || 4000)
  }
}

class Cmd extends CliCommand {

  constructor() {
    super(
      'serve-question',
      'run a dev server'
    )
  }

  run(args, app: App = new ExampleApp()) {
    args = args || {};
    logger.silly('args: ', args);

    let startServer = (server: Server) => new Promise((resolve, reject) => {
      server.on('error', (e) => {
        logger.error(e);
        reject(e);
      });

      server.on('listening', () => {
        logger.silly(`[startServer] listening on ${opts.port}`);
        resolve(server);
      });

      server.listen(opts.port);
    });

    let opts = ServeQuestionOpts.build(args);
    let dir = resolve(opts.dir);
    let questionOpts = Question.buildOpts(args);
    let question = new Question(dir, questionOpts, tmpSupport, app);

    return question.prepareWebpackConfigs(opts.clean)
      .then(({ client, controllers }) => {
        return Promise.resolve({
          client: webpack(client),
          controllers: webpack(controllers)
        });
      })
      .then(compilers => {
        let paths = {
          controllers: questionOpts.controllers.filename,
          client: questionOpts.client.bundleName,
          externals: question.client.externals
        };
        let ids = {
          controllers: question.controllers.uid
        }
        return app.server(compilers, paths, ids, new ReloadableConfig(question.config));
      })
      .then(server => {
        startServer(server);
        return server;
      })
      .then(server => watchMaker.init(question.config, (n) => server.reload(n)))
      .then(() => `server listening on ${opts.port}`)
      .catch(error => {
        logger.error(error.message);
        logger.error(error.stack);
      });
  }
}

export default new Cmd();