import _ from 'lodash';
import { buildLogger } from '../log-factory';
import fs from 'fs-extra';
import { join } from 'path';

const logger = buildLogger();

export class BuildOpts {

  constructor(config = 'config.json', dependencies = 'dependencies.json', markup = 'index.html') {
    this.config = config;
    this.dependencies = dependencies;
    this.markup = markup;
  }

  static build(args) {
    new BuildOpts(
      args['question-config-file'],
      args['question-dependencies-file'],
      args['question-markup-file'])
  }
}

export class QuestionConfig {
  constructor(dir, opts) {
    opts = opts || new BuildOpts();
    this.dir = dir;
    this.filenames = opts;
    logger.silly('filenames', this.filenames);
    this._config = this.readConfig();
    this._markup = this.readMarkup();
    logger.silly('config', this._config);
    this._dependencies = this._readJson(this.filenames.dependencies) || {};
    logger.silly('dependencies', this._dependencies);
  }

  _readJson(n) {
    return fs.readJsonSync(join(this.dir, n));
  }

  get config() {
    return this._config;
  }

  readConfig() {
    return this._readJson(this.filenames.config);
  }

  readMarkup() {
    let markupPath = join(this.dir, this.filenames.markup);
    return fs.readFileSync(markupPath, 'utf8');
  }

  get markup() {
    return this._markup;
  }

  get localDependencies() {
    return this._dependencies;
  }

  get npmDependencies() {
    return _.reduce(this.pies, (acc, p) => {
      logger.silly('[npmDependencies] p: ', p);
      if (p.localPath) {
        acc[p.name] = p.localPath;
      }
      return acc;
    }, {});
  }

  get pies() {
    let rawPies = _.map(this._config.pies, 'pie');
    let toUniqueNames = (acc, p) => {
      let existing = _.find(acc, { name: p.name });
      if (existing) {
        existing.versions = _(existing.versions).concat(p.version).uniq();
      }
      else {
        acc.push({
          name: p.name,
          versions: [p.version],
          localPath: this._dependencies[p.name],
          installedPath: join(this.dir, 'node_modules', p.name)
        });
      }
      return acc;
    };
    let out = _.reduce(rawPies, toUniqueNames, []);
    logger.silly('[pies]', JSON.stringify(out));
    return out;
  }


  get piePackages() {
    return this.readPackages(_.map(this.pies, 'name'));
  }


  readPackages(names) {
    let nodeModulesPath = join(this.dir, 'node_modules');
    if (!fs.existsSync(nodeModulesPath)) {
      throw new Error('pie packages cant be read until the "node_modules" directory has been installed');
    }
    return _.map(names, name => this._readJson(join('node_modules', name, 'package.json')));
  }
}