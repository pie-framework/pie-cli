import { buildLogger } from '../log-factory';
import Question from '../question';
import CliCommand from './cli-command';
import { BuildOpts as ClientBuildOpts } from '../question/client';
import { BuildOpts as ControllersBuildOpts } from '../question/controllers';
import { resolve } from 'path';
import * as watchMaker from '../watch/watchmaker';
import webpack from 'webpack';
import ExampleApp from '../example-app';

const logger = buildLogger()

export class ServeQuestionOpts {
  constructor(dir, clean) {
    this.dir = dir;
    this.clean = clean;
  }

  static build(args) {
    args = args || {};
    return new ServeQuestionOpts(
      args.dir || process.cwd(),
      args.clean === 'true' || args.clean === true || false)
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
    args.clean = args.clean === true || args.clean === 'true';
    logger.silly('args: ', args);

    args.port = args.port || 4000;

    let startServer = (server) => new Promise((resolve, reject) => {
      server.on('error', (e) => {
        logger.error(e);
        reject(e);
      });

      server.on('listening', () => {
        logger.silly(`[startServer] listening on ${args.port}`);
        resolve(server);
      });

      server.listen(args.port);
    });

    let opts = ServeQuestionOpts.build(args);
    let clientOpts = ClientBuildOpts.build(args);
    let controllerOpts = ControllersBuildOpts.build(args);
    let dir = resolve(opts.dir);
    let clientFrameworkSupport = [];
    logger.warn('TODO: need to plug in client framework support back in');
    let app = new ExampleApp();
    let question = new Question(dir, clientOpts, controllerOpts, clientFrameworkSupport, app);

    question.prepareWebpackConfigs(opts.clean)
      .then(({ client, controllers }) => {
        return {
          client: webpack(client),
          controllers: webpack(controllers)
        };
      })
      .then(compilers => {
        let opts = {
          paths: {
            controllers: controllerOpts.filename,
            client: clientOpts.bundleName
          },
          ids: {
            controllers: question.controllers.uid
          },
          markup: () => question.config.readMarkup(),
          model: () => question.config.readConfig()
        };

        return app.server(compilers, opts);
      })
      .then(server => {
        startServer(server);
        return server;
      })
      .then(server => watchMaker.init(question.config, (n) => server.reload(n)))
      .then(() => `server listening on ${args.port}`)
      .catch(error => {
        logger.error(error.message);
        logger.error(error.stack);
      });
  }
}

let cmd = new Cmd();
export let match = cmd.match.bind(cmd);
export let usage = cmd.usage;
export let summary = cmd.summary;
export let run = cmd.run.bind(cmd);