import { resolve, dirname, extname, join } from 'path';
import { existsSync, readFileSync } from 'fs-extra';
import * as _ from 'lodash';
import { buildLogger, getLogger } from '../log-factory';
import * as ejs from 'ejs';
import * as winston from 'winston';

const logger = buildLogger();

let marked = require('marked');
let TerminalRenderer = require('marked-terminal');

marked.setOptions({
  renderer: new TerminalRenderer()
});

export default class CliCommand {

  protected cliLogger: winston.LoggerInstance;

  constructor(readonly name, readonly summary, readonly usage?) {
    this.name = name;
    this.summary = `${name} - ${summary}`;
    this.usage = this._initUsage(usage);
    this.cliLogger = getLogger(`CLI`);
  }

  _initUsage(usageValue) {
    let contents = this._loadUsageContents(usageValue);
    return marked(contents);
  }

  _loadUsageContents(usageValue): string {

    let getMdFilename = () => {
      if (!usageValue) {
        return `${this.name}.md`;
      } else if (extname(usageValue) === '.md') {
        return usageValue;
      }
    }

    let mdFile = getMdFilename();

    if (mdFile) {
      let mdPath = join(__dirname, mdFile);
      let ejsPath = `${mdPath}.ejs`;
      if (existsSync(ejsPath)) {
        let ejsSrc = readFileSync(ejsPath, 'utf8');
        return ejs.render(ejsSrc, {
          loadFile: (p) => {
            logger.silly('load path: ', p);
            let rel = resolve(join(dirname(ejsPath), p));
            logger.silly('relative path: ', rel);
            return readFileSync(rel, 'utf8');
          }
        });
      } else if (existsSync(mdPath)) {
        return readFileSync(mdPath, 'utf8');
      } else {
        return '';
      }
    } else {
      return usageValue;
    }
  }

  match(args) {
    let includes = _.includes(args._, this.name);
    logger.debug(this.name, 'match?', JSON.stringify(args), 'includes?', includes);
    return includes;
  }

  run(args): Promise<any> | any {
    throw new Error('Not Implemented');
  }

}