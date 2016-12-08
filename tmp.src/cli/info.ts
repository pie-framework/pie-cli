import { buildLogger } from '../log-factory';
import Question from '../question';
import CliCommand from './cli-command';
import { resolve } from 'path';
import * as watchMaker from '../watch/watchmaker';
import * as webpack from 'webpack';
import { Server } from '../server/types';
import InfoApp from '../apps/info';
import ExampleApp from '../apps/example';
import { startServer } from '../server/utils';
import tmpSupport from './tmp-support';
import { ReloadableConfig } from '../question/config';
import * as express from 'express';
import { join } from 'path';

const logger = buildLogger();

export class InfoOpts {
  constructor(readonly dir: string = process.cwd(), readonly clean: boolean = false, readonly port: number = 4000) { }

  static build(args) {
    args = args || {};
    return new InfoOpts(
      args.dir || process.cwd(),
      args.clean === 'true' || args.clean === true || false,
      args.port || 4000)
  }
}

class Cmd extends CliCommand {

  constructor() {
    super(
      'info',
      'launch a server displaying info'
    )
  }

  async run(args) {
    //todo..
  }
}

export default new Cmd();