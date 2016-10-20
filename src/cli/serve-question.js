import { buildLogger } from '../log-factory';
import _ from 'lodash';
import CliCommand from './cli-command';

const logger = buildLogger()

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
    return Promise.reject(new Error('todo...'));
    //1. npm install for elements
    //2. npm install for controllers
    //3. webpack dev middleware for both 
    //4. set up a watch from src -> node_modules
  }
}

let cmd = new Cmd();
export let match = cmd.match.bind(cmd);
export let usage = cmd.usage;
export let summary = cmd.summary;
export let run = cmd.run.bind(cmd);