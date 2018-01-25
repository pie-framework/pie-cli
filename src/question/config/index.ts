import * as _ from 'lodash';

import { Declaration, ElementDeclaration } from '../../code-gen';
import { Manifest, Model, RawConfig, ScoringType, WEIGHTED, Weight, fromPath } from './types';

import { buildLogger } from 'log-factory';
import { join } from 'path';
import { readFileSync, existsSync } from 'fs-extra';
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
    readonly config = 'config',
    readonly markup = 'index.html'
  ) { }

  public resolveConfig(dir: string): string {

    if (this.config.endsWith('.js') || this.config.endsWith('.json')) {
      return join(dir, this.config);
    }
    const jsPath = join(dir, `${this.config}.js`);
    return existsSync(jsPath) ? jsPath : join(dir, `${this.config}.json`);
  }
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
    this._raw = this.readRawConfig();

    const result = validateConfig(this._raw);

    if (!result.valid) {
      throw new Error(`Invalid json config: ${JSON.stringify(result)}`);
    }
  }

  private readRawConfig(): RawConfig {
    const out = fromPath(this.dir, this.filenames);
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
