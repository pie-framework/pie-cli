import { buildLogger } from '../log-factory';
import Question from '../question';
import CliCommand from './cli-command';
import { resolve } from 'path';
import * as watchMaker from '../watch/watchmaker';
import webpack from 'webpack';
import ExampleApp from '../example-app';
import _ from 'lodash';
import { join } from 'path';
import FrameworkSupport from '../framework-support';

const logger = buildLogger();

export class ServeQuestionOpts {
  constructor(dir, clean, port) {
    this.dir = dir;
    this.clean = clean;
    this.port = port;
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
    let support = args.support ? (_.isArray(args.support) ? args.support : [args.support]) : [];
    support = _.map(support, (s) => resolve(join(dir, s)));

    let app = new ExampleApp();
    support = support.concat(app.frameworkSupport());
    let questionOpts = Question.buildOpts(args);

    logger.debug('call FrameworkSupport.bootstrap with: ', support);
    return FrameworkSupport.bootstrap(dir, support)
      .then(frameworkSupport => {
        let question = new Question(dir, questionOpts, frameworkSupport, app);
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

            return app.server(compilers, opts);
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

      });
  }
}

let cmd = new Cmd();
export let match = cmd.match.bind(cmd);
export let usage = cmd.usage;
export let summary = cmd.summary;
export let run = cmd.run.bind(cmd);