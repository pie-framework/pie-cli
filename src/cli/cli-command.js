import path from 'path';
import { readFileSync } from 'fs-extra';
import _ from 'lodash';
import { buildLogger } from '../log-factory';

const logger = buildLogger();

let marked = require('marked');
let TerminalRenderer = require('marked-terminal');

marked.setOptions({
  renderer: new TerminalRenderer()
});

export default class CliCommand {

  constructor(name, summary, usage) {
    this.name = name;
    this.summary = summary;
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
      } else if (path.extname(usageValue) === '.md') {
        return usageValue;
      }
    }

    let mdFile = getMdFilename();

    if (mdFile) {
      return readFileSync(path.join(__dirname, `../../docs/${mdFile}`), { encoding: 'utf8' });
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