import _ from 'lodash';
import { buildLogger } from '../log-factory';
import { readJsonSync, existsSync, readFileSync } from 'fs-extra';
import { join } from 'path';
import * as configValidator from './config-validator';

const logger = buildLogger();

export class BuildOpts {

  constructor(config = 'config.json',
    dependencies = 'dependencies.json',
    markup = 'index.html',
    schemasDir = 'docs/schemas') {
    this.config = config;
    this.dependencies = dependencies;
    this.markup = markup;
    this.schemasDir = schemasDir;
  }

  static build(args) {
    args = args || {};

    return new BuildOpts(
      args['questionConfigFile'],
      args['questionDependenciesFile'],
      args['questionMarkupFile'],
      args['questionSchemasDir']
    )
  }
}

export class QuestionConfig {
  constructor(dir, opts) {
    opts = opts || new BuildOpts();
    this.dir = dir;
    this.filenames = opts;
    logger.silly('filenames', this.filenames);

    let dependenciesPath = join(this.dir, this.filenames.dependencies);
    this._dependencies = existsSync(dependenciesPath) ? readJsonSync(dependenciesPath, { throws: false }) : {};

    logger.silly('dependencies', this._dependencies);
  }

  static fileError(name) {
    return new Error(`failed to load file: ${name}`);
  }

  _readJson(n, errMsg) {
    try {
      logger.silly('[_readJson] n: ', n);
      return readJsonSync(join(this.dir, n));
    } catch (e) {

      logger.silly('[_readJson] e: ', e);
      throw errMsg ? QuestionConfig.fileError(n) : e;
    }
  }

  get config() {
    if (!this._config) {
      this._config = this.readConfig();
    }

    if (!this.isConfigValid(this._config)) {
      logger.warn('[get config] config is not valid');
    }

    return this._config;
  }

  _loadConfigSchema(pie) {
    try {
      logger.silly('[_loadConfigSchema] pie: ', pie, 'this: ', this);
      return this._readJson(join('node_modules', pie, `${this.filenames.schemasDir}/config.json`));
    } catch (e) {
      logger.silly('[_loadConfigSchema] error: ', e);
      //no-op
    }
  }

  isConfigValid(json) {
    json = json || this.readConfig();
    let result = configValidator.validate(json, this._loadConfigSchema.bind(this));
    if (!result.valid) {
      logger.error(`config.json validation result: ${JSON.stringify(result, null, '  ')}`);
    }
    return result.valid;
  }

  readConfig() {
    return this._readJson(this.filenames.config, `failed to load the configuration file: ${this.filenames.config}`);
  }

  readMarkup() {
    let markupPath = join(this.dir, this.filenames.markup);
    try {
      return readFileSync(markupPath, 'utf8');
    } catch (e) {
      throw QuestionConfig.fileError(this.filenames.markup);
    }
  }

  get markup() {
    if (!this._markup) {
      this._markup = this.readMarkup();
    }
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
      } else {

        /**
         * TODO: We don't have a strategy in place for different versions (or version ranges) of the same pie.
         * For now throw an error if we find multiple versions.
         */
        if (p.versions.length > 1) {
          throw new Error(`multiple versions found for ${p.name}`);
        }

        acc[p.name] = _.first(p.versions)
      }
      return acc;
    }, {});
  }

  get pies() {
    let rawPies = _.map(this.config.pies, 'pie');
    let toUniqueNames = (acc, p) => {
      let existing = _.find(acc, { name: p.name });
      if (existing) {
        existing.versions = _(existing.versions).concat(p.version).uniq().value();
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
    if (!existsSync(nodeModulesPath)) {
      throw new Error('pie packages cant be read until the "node_modules" directory has been installed');
    }
    return _.map(names, name => this._readJson(join('node_modules', name, 'package.json')));
  }

}