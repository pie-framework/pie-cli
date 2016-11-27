import { buildLogger } from '../log-factory';
import Question from '../question';
import CliCommand from './cli-command';
import { resolve } from 'path';
import * as watchMaker from '../watch/watchmaker';
import * as webpack from 'webpack';
import ExampleApp from '../example-app';
import tmpSupport from './tmp-support';

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

  run(args) {
    args = args || {};
    logger.silly('args: ', args);

    let startServer = (server) => new Promise((resolve, reject) => {
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
    let exampleApp = new ExampleApp();
    let questionOpts = Question.buildOpts(args);
    let question = new Question(dir, questionOpts, tmpSupport, exampleApp);

    return question.prepareWebpackConfigs(opts.clean)
      .then(({ client, controllers }) => {
        return Promise.resolve({
          client: webpack(client),
          controllers: webpack(controllers)
        });
      })
      .then(compilers => {
        let opts = {
          paths: {
            controllers: questionOpts.controllers.filename,
            client: questionOpts.client.bundleName
          },
          ids: {
            controllers: question.controllers.uid
          },
          markup: () => question.config.readMarkup(),
          model: () => question.config.readConfig()
        };

        return exampleApp.server(compilers, opts);
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