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
import * as watchMaker from '../watch/watchmaker';
import { init as initSock } from '../server/sock';

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

let _reloadImpl = () => {
  console.log('not implemented');
}

let reloadFn = () => {
  logger.debug('[reloadFn], _reloadImpl? ', _reloadImpl);
  if (_reloadImpl) {
    _reloadImpl();
  }
};

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

    let createServer = (app) => {
      return Promise.resolve({
        server: http.createServer(app),
        app: app
      });
    }

    let startServer = (server) => {
      return new Promise((resolve, reject) => {
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
        return makeAppServer(configs, renderOpts, reloadFn);
      })
      .then(createServer)
      .then((s) => {
        _reloadImpl = initSock(s.server);
        return s;
      })
      .then(({server}) => startServer(server))
      .then(() => watchMaker.init(question.config))
      .then(server => `server listening on ${args.port}`);
  }
}

let cmd = new Cmd();
export let match = cmd.match.bind(cmd);
export let usage = cmd.usage;
export let summary = cmd.summary;
export let run = cmd.run.bind(cmd);