import _ from 'lodash';
import { buildLogger } from '../log-factory';
import fs from 'fs-extra';
import path from 'path';

const logger = buildLogger();

/** 
 * A representation of a pie question directory,
 * which includes a `config.json`, `index.html`, maybe `dependencies.json`
 * And can also include `node_modules`
 */
export default class Question {
  constructor(dir, opts) {

    opts = _.extend({}, {
      configFile: 'config.json',
      dependenciesFile: 'dependencies.json',
      markupFile: 'index.html'
    }, opts);

    this._dir = dir;

    this._opts = opts;
    logger.silly('opts', this._opts);
    this._config = this._readJson(opts.configFile);
    logger.silly('config', this._config);
    this._dependencies = this._readJson(opts.dependenciesFile) || {};
    logger.silly('dependencies', this._dependencies);
  }

  _readJson(n) {
    return fs.readJsonSync(path.join(this._dir, n));
  }

  get dir() {
    return this._dir;
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

  /**
   * @return Array[{name:, versions: []}]
   */
  get pies() {
    let rawPies = _.map(this._config.pies, 'pie');

    let toUniqueNames = (acc, p) => {
      let existing = _.find(acc, { name: p.name });
      if (existing) {
        existing.versions = _(existing.versions).concat(p.version).uniq();
      } else {
        acc.push({
          name: p.name,
          versions: [p.version],
          localPath: this._dependencies[p.name],
          installedPath: path.join(this._dir, 'node_modules', p.name)
        });
      }
      return acc;
    }

    let out = _.reduce(rawPies, toUniqueNames, []);
    logger.silly('[pies]', JSON.stringify(out));
    return out;
  }

  get piePackages() {
    let nodeModulesPath = path.join(this._dir, 'node_modules');

    if (!fs.existsSync(nodeModulesPath)) {
      throw new Error('pie packages cant be read until node_modules has been installed');
    }

    return _(this.pies)
      .map('name')
      .map((name) => this._readJson(path.join('node_modules', name, 'package.json')))
      .value();
  }

  get piePackageDependencies() {
    let mergeDependencies = (acc, deps) => {
      return _.reduce(deps, (acc, value, key) => {
        if (acc[key]) {
          acc[key].push(value);
        } else {
          acc[key] = [value]
        }
        return acc;
      }, acc);
    };

    return _(this.piePackages).map('dependencies').reduce(mergeDependencies, {});
  }

}