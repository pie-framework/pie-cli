import _ from 'lodash';
import { buildLogger } from '../log-factory';
import fs from 'fs-extra';
import { join } from 'path';
import { validate as validateConfig } from './config-validator';

const logger = buildLogger();

export class BuildOpts {

  constructor(config = 'config.json', dependencies = 'dependencies.json', markup = 'index.html') {
    this.config = config;
    this.dependencies = dependencies;
    this.markup = markup;
  }

  static build(args) {
    args = args || {};

    return new BuildOpts(
      args['questionConfigFile'],
      args['questionDependenciesFile'],
      args['questionMarkupFile'])
  }
}

export class QuestionConfig {
  constructor(dir, opts) {
    opts = opts || new BuildOpts();
    this.dir = dir;
    this.filenames = opts;
    logger.silly('filenames', this.filenames);
    this._config = this.readConfig();
    logger.silly('config', this._config);
    this._markup = this.readMarkup();
    logger.silly('markup', this._markup);

    this._dependencies = this._readJson(
      this.filenames.dependencies,
      `failed to load the dependencies file: ${this.filenames.dependencies}`);

    logger.silly('dependencies', this._dependencies);
  }

  static fileError(name) {
    return new Error(`failed to load file: ${name}`);
  }

  _readJson(n, errMsg) {
    try {
      return fs.readJsonSync(join(this.dir, n));
    } catch (e) {

      logger.silly('[_readJson] e: ', e);
      throw errMsg ? QuestionConfig.fileError(n) : e;
    }
  }

  get config() {
    return this._config;
  }

  readConfig() {
    let json = this._readJson(this.filenames.config, `failed to load the configuration file: ${this.filenames.config}`);
    let result = validateConfig(json);
    if (result.valid) {
      return json;
    } else {
      logger.error(`config.json validation.errors: ${JSON.stringify(result.errors, null, '  ')}`);
      throw new Error('config.json has an invalid schema');
    }
  }


  readMarkup() {
    let markupPath = join(this.dir, this.filenames.markup);
    try {
      return fs.readFileSync(markupPath, 'utf8');
    } catch (e) {
      throw QuestionConfig.fileError(this.filenames.markup);
    }
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