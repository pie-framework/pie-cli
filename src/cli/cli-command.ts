import * as TerminalRenderer from 'marked-terminal';
import * as _ from 'lodash';
import * as ejs from 'ejs';
import * as marked from 'marked';
import * as winston from 'winston';

import { buildLogger, getLogger } from 'log-factory';
import { dirname, extname, join, resolve } from 'path';
import { existsSync, readFileSync } from 'fs-extra';

const logger = buildLogger();

marked.setOptions({
  renderer: new TerminalRenderer()
});

export default class CliCommand {

  protected cliLogger: winston.LoggerInstance;

  constructor(readonly name, readonly summary, readonly usage?) {
    this.name = name;
    this.summary = `${name} - ${summary}`;
    this.usage = this.initUsage(usage);
    this.cliLogger = getLogger(`CLI`);
  }

  public match(args) {
    const includes = _.includes(args._, this.name);
    logger.debug(this.name, 'match?', JSON.stringify(args), 'includes?', includes);
    return includes;
  }

  public run(args): Promise<any> | any {
    throw new Error('Not Implemented');
  }

  private initUsage(usageValue) {
    const contents = this.loadUsageContents(usageValue);
    return marked(contents);
  }

  private loadUsageContents(usageValue): string {

    const getMdFilename = () => {
      if (!usageValue) {
        return `${this.name}.md`;
      } else if (extname(usageValue) === '.md') {
        return usageValue;
      }
    };

    const mdFile = getMdFilename();

    if (mdFile) {
      const mdPath = join(__dirname, mdFile);
      const ejsPath = `${mdPath}.ejs`;
      if (existsSync(ejsPath)) {
        const ejsSrc = readFileSync(ejsPath, 'utf8');
        return ejs.render(ejsSrc, {
          loadFile: (p) => {
            logger.silly('load path: ', p);
            const rel = resolve(join(dirname(ejsPath), p));
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
}
