import { buildLogger } from '../log-factory';
import _ from 'lodash';
import Question from '../question';
import CliCommand from './cli-command';
import { build as buildMarkupExample } from '../code-gen/markup-example';
import { BuildOpts as ClientBuildOpts } from '../question/client';
import { BuildOpts as ControllersBuildOpts } from '../question/controllers';
import { resolve, join } from 'path';
import { make as makeApp } from '../server';
import http from 'http';
import * as watchMaker from '../watch/watchmaker';
import { init as initSock } from '../server/sock';
import webpack from 'webpack';

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

    let linkSockToCompiler = (name, fns, compiler) => {
      compiler.plugin('done', (stats) => {
        process.nextTick(() => {
          if (stats.hasErrors()) {
            logger.error('recompile failed');
            let info = stats.toJson('errors-only');
            logger.error(info.errors);
            fns.error(name, info.errors);
          } else {
            logger.debug(`${name}: reload!`);
            fns.reload(name);
          }
        });
      });
    };

    let opts = ServeQuestionOpts.build(args);
    let clientOpts = ClientBuildOpts.build(args);
    let controllerOpts = ControllersBuildOpts.build(args);
    let dir = resolve(opts.dir);
    let question = new Question(dir, clientOpts, controllerOpts);

    question.prepareWebpackConfigs(opts.clean)
      .then(({ client, controllers }) => {
        return {
          client: webpack(client),
          controllers: webpack(controllers)
        };
      })
      .then(compilers => {
        let renderOpts = {
          controllersFile: controllerOpts.filename,
          controllersUid: question.controllers.uid,
          clientFile: clientOpts.bundleName,
          config: question.config.config,
          markup: question.config.markup
        };

        let app = makeApp(compilers, renderOpts);
        let httpServer = http.createServer(app);
        let sockFunctions = initSock(httpServer);
        linkSockToCompiler('controllers', sockFunctions, compilers.controllers);
        linkSockToCompiler('client', sockFunctions, compilers.client);
        return { server: httpServer };
      })
      .then(({ server }) => startServer(server))
      .then(() => watchMaker.init(question.config))
      .then(() => `server listening on ${args.port}`);
  }
}

let cmd = new Cmd();
export let match = cmd.match.bind(cmd);
export let usage = cmd.usage;
export let summary = cmd.summary;
export let run = cmd.run.bind(cmd);