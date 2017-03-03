import * as _ from 'lodash';

import { Declaration, ElementDeclaration } from '../../code-gen/declaration';
import { Element, LocalFile, LocalPackage, NotInstalledPackage, PiePackage } from './elements';
import { Model, RawConfig, Weight, fromPath } from './raw';
import { ScoringType, WEIGHTED } from './scoring-type';
import { existsSync, readFileSync } from 'fs-extra';

import { KeyMap } from '../../npm/types';
import { Manifest } from './manifest';
import { buildLogger } from 'log-factory';
import { join } from 'path';
import { hash as mkHash } from '../../npm/dependency-helper';
import { validate } from './validator';

export { Manifest };
export { ElementDeclaration, Declaration };

const logger = buildLogger();

export class FileNames {

  public static build(args: any = {}) {
    return new FileNames(args.questionConfigFile, args.questionMarkupFile);
  }

  constructor(
    readonly json = 'config.json',
    readonly markup = 'index.html'
  ) { }

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

  public reload<A>(fn: () => A): A {
    this.jsonConfig.reload();
    return fn();
  }


  get pieModels() {
    return this.reload(() => this.jsonConfig.pieModels);
  }

  get elementModels() {
    return this.reload(() => this.jsonConfig.elementModels);
  }

  get scoringType() {
    return this.jsonConfig.scoringType;
  }

  get markup() {
    return this.reload(() => this.jsonConfig.markup);
  }

  get langs() {
    return this.reload(() => this.jsonConfig.langs);
  }

  get weights() {
    return this.reload(() => this.jsonConfig.weights);
  }

  get dir() {
    return this.jsonConfig.dir;
  }
}

export class JsonConfig implements Config {

  readonly scoringType: ScoringType = WEIGHTED;
  private raw: RawConfig;

  constructor(readonly dir, readonly filenames: FileNames = new FileNames()) {
    this.reload();
  }


  public valid(): boolean {
    return validate(this.raw, this.installedPies).valid;
  }

  /**
   * Reload the raw config from file.
   */
  public reload() {
    this.raw = this._readRaw();

    // validate the main config (not the pies).
    const pies = existsSync(join(this.dir, 'node_modules')) ? this.installedPies : [];

    const result = validate(this.raw, pies);

    if (!result.valid) {
      throw new Error(`Invalid json config: ${JSON.stringify(result)}`);
    }
  }

  private _readRaw(): RawConfig {
    const p = join(this.dir, this.filenames.json);
    const out = fromPath(p);
    logger.debug('this._raw: ', out);
    return out;
  }

  get langs(): string[] {
    return this.raw.langs;
  }

  get weights(): Weight[] {
    return this.raw.weights;
  }

  get elements(): Element[] {
    return _.map(this.raw.elements, (value, key) => {
      return LocalFile.build(key, value) ||
        PiePackage.build(this.dir, key, value) ||
        LocalPackage.build(key, value) ||
        new NotInstalledPackage(key, value);
    });
  }

  get markup(): string {
    const p = join(this.dir, this.filenames.markup);
    return readFileSync(p, 'utf8');
  }

  get declarations(): ElementDeclaration[] {

    const toDeclaration = (pkg: Element): ElementDeclaration => {
      const isLocalFile = (pkg instanceof LocalFile);
      return isLocalFile ?
        new ElementDeclaration(pkg.key, pkg.value) :
        new ElementDeclaration(pkg.key);
    };
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

    const locals = _.reduce(this.localFiles, (acc, value, key) => {
      acc[key] = { path: value, hash: mkHash(readFileSync(value, 'utf8')) };
      return acc;
    }, {});

    const src = {
      locals,
      dependencies: this.dependencies,
    };

    const hash = mkHash(JSON.stringify(src));
    return { hash, src };
  }

  get installedPies(): PiePackage[] {

    const nodeModulesDir = join(this.dir, 'node_modules');

    if (!existsSync(nodeModulesDir)) {
      throw new Error(`Can't retrieve PiePackages until the node modules have been installed.`);
    }

    return _(this.raw.models)
      .map((m) => m.element)
      .map((e) => {
        return {
          key: e,
          root: '',
          value: join(this.dir, 'node_modules', e)
        };
      })
      .map(({ root, key, value }) => PiePackage.build(root, key, value))
      .compact()
      .value();
  }


  private _filterModels(predicate) {
    const pieNames = _.map(this.installedPies, (p) => p.key);
    return _.filter(this.raw.models, (m) => {
      const isPie = _.includes(pieNames, m.element);
      return predicate(isPie);
    });
  }

  get pieModels(): Model[] {
    return this._filterModels((isPie) => isPie);
  }

  get elementModels(): Model[] {
    return this._filterModels((isPie) => !isPie);
  }
}
