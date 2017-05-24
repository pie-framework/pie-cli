import * as _ from 'lodash';

import { Declaration, ElementDeclaration } from '../../code-gen';
import { Element, LocalFile, LocalPackage, NotInstalledPackage, PiePackage } from './elements';
import { KeyMap, hash as mkHash } from '../../npm';
import { Manifest, Model, RawConfig, ScoringType, WEIGHTED, Weight, fromPath } from './types';
import { existsSync, readFileSync } from 'fs-extra';
import { join, resolve } from 'path';

import { buildLogger } from 'log-factory';
import { validate } from './validator';

export {
  RawConfig, Manifest, ScoringType, Weight, Model,
  ElementDeclaration, Declaration, PiePackage
};

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
  scoringType: ScoringType;
  markup: string;
  langs: string[];
  weights: Weight[];
  dir: string;
  models(): Model[];
  // elementModels(installed: PiePackage[]): Model[];
}

export class ReloadableConfig implements Config {
  constructor(readonly jsonConfig: JsonConfig) { }

  public reload<A>(fn: () => A): A {
    this.jsonConfig.reload();
    return fn();
  }

  public models() {
    return this.jsonConfig.models();
  }

  // public elementModels(installed: PiePackage[]) {
  //   return this.jsonConfig.elementModels(installed);
  // }

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

export function getInstalledPies(modulesDir: string, elements: string[]): PiePackage[] {

  if (!existsSync(modulesDir)) {
    throw new Error(`Can't retrieve PiePackages until the node modules have been installed.`);
  }

  logger.silly('[getInstalledPies] modulesDir', modulesDir, 'elements: ', elements);

  return _(elements)
    .map(e => {
      return {
        key: e,
        root: '',
        value: join(modulesDir, e)
      };
    })
    .map(({ root, key, value }) => PiePackage.build(root, key, value))
    .compact()
    .value();
}

export class JsonConfig implements Config {

  public static build(dir: string, args: any): JsonConfig {
    return new JsonConfig(dir, FileNames.build(args));
  }

  // tslint:disable-next-line
  readonly scoringType: ScoringType = WEIGHTED;
  private raw: RawConfig;

  constructor(readonly dir, readonly filenames: FileNames = new FileNames()) {
    this.reload();
  }

  public isPie(names, m) {
    const out = _.includes(names, m.element);
    return out;
  }

  public models() {
    return this.raw.models;
  }

  public valid(modulesDir: string): boolean {
    return validate(this.raw, this.installedPies(modulesDir)).valid;
  }

  public installedPies(modulesDir: string): PiePackage[] {
    const elements = _.map(this.elements, e => e.key);
    return getInstalledPies(modulesDir, elements);
  }

  /**
   * Reload the raw config from file.
   */
  public reload() {
    this.raw = this._readRaw();

    const result = validate(this.raw, []);

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
        new ElementDeclaration(pkg.key, resolve(this.dir, pkg.value)) :
        new ElementDeclaration(pkg.key);
    };
    return _.map(this.elements, toDeclaration);
  }

  get dependencies(): KeyMap {
    return this._filterElements((e) => !(e instanceof LocalFile));
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

  private _filterElements(predicate: (Element) => boolean): KeyMap {
    return _(this.elements).reduce((acc, e: Element) => {
      if (predicate(e)) {
        acc[e.key] = e.value;
      }
      return acc;
    }, {});
  }

  private get localFiles(): KeyMap {
    return this._filterElements((e) => (e instanceof LocalFile));
  }

}
