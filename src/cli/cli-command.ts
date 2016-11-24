import { resolve, dirname, extname, join } from 'path';
import { existsSync, readFileSync } from 'fs-extra';
import * as _ from 'lodash';
import { buildLogger } from '../log-factory';
import * as ejs from 'ejs';

const logger = buildLogger();

let marked = require('marked');
let TerminalRenderer = require('marked-terminal');

marked.setOptions({
  renderer: new TerminalRenderer()
});

export default class CliCommand {

  constructor(readonly name, readonly summary, readonly usage?) {
    this.name = name;
    this.summary = `${name} - ${summary}`;
    this.usage = this._initUsage(usage);
  }

  _initUsage(usageValue) {
    let contents = this._loadUsageContents(usageValue);
    return marked(contents);
  }

  _loadUsageContents(usageValue) {

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
      } else {
        return readFileSync(mdPath, 'utf8');
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

}