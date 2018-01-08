import * as _ from 'lodash';

import { Declaration, ElementDeclaration } from '../../code-gen';
import { Manifest, Model, RawConfig, ScoringType, WEIGHTED, Weight, fromPath } from './types';

import { buildLogger } from 'log-factory';
import { join } from 'path';
import { readFileSync } from 'fs-extra';
import { validateConfig } from './validator';

export {
  RawConfig, Manifest, ScoringType, Weight, Model,
  ElementDeclaration, Declaration
};

const logger = buildLogger();

export class FileNames {

  public static build(args: any = {}) {
    return new FileNames(args.questionConfigFile, args.questionMarkupFile);
  }

  constructor(
    readonly config = 'config.json',
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
}

export class JsonConfig implements Config {

  public static build(dir: string, args: any): JsonConfig {
    return new JsonConfig(dir, FileNames.build(args));
  }

  // tslint:disable-next-line
  readonly scoringType: ScoringType = WEIGHTED;
  // tslint:disable-next-line
  private _raw: RawConfig;

  constructor(readonly dir, readonly filenames: FileNames = new FileNames()) {
    this.reload();
  }

  get raw() {
    return this._raw;
  }

  get elements() {
    return this._raw.elements;
  }

  public isPie(names, m) {
    const out = _.includes(names, m.element);
    return out;
  }

  public models() {
    return this._raw.models;
  }

  /**
   * Reload the raw config from file.
   */
  public reload() {
    this._raw = this._readRaw();

    const result = validateConfig(this._raw);

    if (!result.valid) {
      throw new Error(`Invalid json config: ${JSON.stringify(result)}`);
    }
  }

  private _readRaw(): RawConfig {
    const p = join(this.dir, this.filenames.config);
    const out = fromPath(p);
    logger.debug('this._raw: ', out);
    return out;
  }

  get langs(): string[] {
    return this._raw.langs;
  }

  get weights(): Weight[] {
    return this._raw.weights;
  }

  get markup(): string {
    const p = join(this.dir, this.filenames.markup);
    return readFileSync(p, 'utf8');
  }
}
