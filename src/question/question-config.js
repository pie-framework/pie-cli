import _ from 'lodash';
import { buildLogger } from '../log-factory';
import fs from 'fs-extra';
import { join } from 'path';

const logger = buildLogger();

let defaultFilenames = {
  config: 'config.json',
  dependencies: 'dependencies.json',
  markup: 'index.html'
};

export default class QuestionConfig {
  constructor(dir, filenames) {
    this.dir = dir;
    this.filenames = filenames;
    this.filenames = _.extend({}, defaultFilenames, filenames);
    logger.silly('filenames', this.filenames);
    this._config = this._readJson(this.filenames.config);
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

  get markup() {
    if (!this._markup) {
      this._markup = fs.readFileSync(join(this.dir, this.filenames.markup), { encoding: 'utf8' });
    }

    if (!this._markup) {
      throw new Error('cant read in markup');
    }

    return this._markup;
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