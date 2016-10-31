import { buildLogger } from '../log-factory';
import _ from 'lodash';
import Question from '../question';
import CliCommand from './cli-command';
import { build as buildMarkupExample } from '../code-gen/markup-example';
import { BuildOpts as ClientBuildOpts } from '../question/client';
import { BuildOpts as ControllersBuildOpts } from '../question/controllers';
import { resolve, join } from 'path';
import { make as makeAppServer } from '../server';
import http from 'http';

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

    let startServer = (app) => {
      return new Promise((resolve, reject) => {
        let server = http.createServer(app);

        server.on('error', (e) => {
          logger.error(e);
          reject(e);
        });

        server.on('listening', () => {
          logger.silly(` > server: listening on ${args.port}`);
          resolve(server);
        });

        server.listen(args.port);
      });
    }

    let opts = ServeQuestionOpts.build(args);
    let clientOpts = ClientBuildOpts.build(args);
    let controllerOpts = ControllersBuildOpts.build(args);
    let dir = resolve(opts.dir);
    let question = new Question(dir, clientOpts, controllerOpts);

    return question.prepareWebpackConfigs(opts.clean)
      .then(configs => {
        let renderOpts = {
          controllersFile: controllerOpts.filename,
          controllersUid: question.controllers.uid,
          clientFile: clientOpts.bundleName,
          config: question.config.config,
          markup: question.config.markup
        }
        return makeAppServer(configs, renderOpts);
      })
      .then(startServer)
      .then(server => `server listening on ${args.port}`);
  }
}

let cmd = new Cmd();
export let match = cmd.match.bind(cmd);
export let usage = cmd.usage;
export let summary = cmd.summary;
export let run = cmd.run.bind(cmd);