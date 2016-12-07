import { fromPath, RawConfig, Model, Weight } from './raw';
import { join, relative } from 'path';
import { buildLogger } from '../../log-factory';
import * as _ from 'lodash';
import { readFileSync, existsSync, readJsonSync } from 'fs-extra';
import { hash as mkHash } from '../../npm/dependency-helper';
import { Element, LocalFile, LocalPackage, PiePackage, NotInstalledPackage } from './elements';
import { ElementDeclaration } from '../../code-gen/declaration';
import { KeyMap, Manifest } from './manifest';
import { validate } from './validator';
import { ScoringType, WEIGHTED } from './scoring-type';

const logger = buildLogger();

export class FileNames {
  constructor(
    readonly json = 'config.json',
    readonly markup = 'index.html'
  ) { }

  static build(args: any = {}) {
    return new FileNames(args.questionConfigFile, args.questionMarkupFile)
  }
}

export interface Config {
  pieModels: Model[];
  elementModels: Model[];
  scoringType: ScoringType;
  markup: string;
  langs: string[];
  weights: Weight[];
  dir: string;
}

export class ReloadableConfig implements Config {
  constructor(readonly jsonConfig: JsonConfig) { }

  _reload<A>(fn: () => A): A {
    this.jsonConfig.reload();
    return fn();
  }


  get pieModels() {
    return this._reload(() => this.jsonConfig.pieModels);
  }

  get elementModels() {
    return this._reload(() => this.jsonConfig.elementModels);
  }

  get scoringType() {
    return this.jsonConfig.scoringType;
  }

  get markup() {
    return this._reload(() => this.jsonConfig.markup);
  }

  get langs() {
    return this._reload(() => this.jsonConfig.langs);
  }

  get weights() {
    return this._reload(() => this.jsonConfig.weights);
  }

  get dir() {
    return this.jsonConfig.dir;
  }
}

export class JsonConfig implements Config {

  private _raw: RawConfig;

  readonly scoringType: ScoringType = WEIGHTED;

  constructor(readonly dir, readonly filenames: FileNames = new FileNames()) {
    this.reload();
  }


  /**
   * Reload the raw config from file.
   */
  reload() {
    this._raw = this._readRaw();

    //validate the main config (not the pies).
    let result = validate(this._raw, []);

    if (!result.valid) {
      throw new Error(`Invalid base config: ${JSON.stringify(result.mainErrors)}`);
    }
  }

  private _readRaw(): RawConfig {
    let p = join(this.dir, this.filenames.json);
    let out = fromPath(p);
    logger.debug('this._raw: ', out);
    return out;
  }

  get langs(): string[] {
    return this._raw.langs;
  }

  get weights(): Weight[] {
    return this._raw.weights;
  }

  get elements(): Element[] {
    return _.map(this._raw.elements, (value, key) => {
      return LocalFile.build(key, value) ||
        PiePackage.build(key, value) ||
        LocalPackage.build(key, value) ||
        new NotInstalledPackage(key, value);
    });
  }

  get markup(): string {
    let p = join(this.dir, this.filenames.markup);
    return readFileSync(p, 'utf8');
  }

  get declarations(): ElementDeclaration[] {

    let toDeclaration = (pkg: Element): ElementDeclaration => {
      let isLocalFile = (pkg instanceof LocalFile);
      return isLocalFile ?
        new ElementDeclaration(pkg.key, pkg.value) :
        new ElementDeclaration(pkg.key);
    }
    return _.map(this.elements, toDeclaration);
  }

  private _filterElements(predicate: (Element) => boolean): KeyMap {
    return _(this.elements).reduce((acc, e: Element) => {
      if (predicate(e)) {
        acc[e.key] = e.value;
      }
      return acc;
    }, {});
  }

  get dependencies(): KeyMap {
    return this._filterElements((e) => !(e instanceof LocalFile));
  }

  private get localFiles(): KeyMap {
    return this._filterElements((e) => (e instanceof LocalFile));
  }

  get manifest(): Manifest {

    let locals = _.reduce(this.localFiles, (acc, value, key) => {
      acc[key] = { path: value, hash: mkHash(readFileSync(value, 'utf8')) }
      return acc;
    }, {});

    let src = {
      dependencies: this.dependencies,
      locals: locals
    }

    let hash = mkHash(JSON.stringify(src));
    return { hash, src }
  }

  get installedPies(): PiePackage[] {

    let nodeModulesDir = join(this.dir, 'node_modules');

    if (!existsSync(nodeModulesDir)) {
      throw new Error(`Can't retrieve PiePackages until the node modules have been installed.`);
    }

    return _(this._raw.models)
      .map('element')
      .map(e => {
        if (!e) {
          throw new Error(`a model is missing a required property: 'element': ${JSON.stringify(this._raw.models)}`)
        }
        return { key: e, value: join(this.dir, 'node_modules', e) }
      })
      .map(({key, value}) => PiePackage.build(key, value))
      .compact()
      .value();
  }

  _filterModels(predicate) {
    let pieNames = _.map(this.installedPies, p => p.key);
    return _.filter(this._raw.models, m => {
      let isPie = _.includes(pieNames, m.element);
      return predicate(isPie);
    });
  }

  get pieModels(): Model[] {
    return this._filterModels((isPie) => isPie);
  }

  get elementModels(): Model[] {
    return this._filterModels(isPie => !isPie);
  }

  valid(): boolean {
    return validate(this._raw, this.installedPies).valid;
  }
}