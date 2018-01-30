import { readJsonSync } from 'fs-extra';
import { FileNames } from './index';

export type KeyMap = {
  [key: string]: any
};

export type Model = {
  id: string
  element: string
};

export type Weight = {
  id: string,
  weight: string
};

export interface RawConfig {
  elements: { [key: string]: string };
  models: Model[];
  weights: Weight[];
  langs: string[];
}

export const loadObjectFromJsFile = (p: string): any => {
  delete require.cache[require.resolve(p)];
  return require(p);
};

export let fromPath = (dir, names: FileNames): RawConfig => {
  const p = names.resolveConfig(dir);
  if (p.endsWith('.js')) {
    return loadObjectFromJsFile(p) as RawConfig;
  } else if (p.endsWith('.json')) {
    return readJsonSync(p) as RawConfig;
  }
};

export let fromJson = (json: {}): RawConfig => {
  return json as RawConfig;
};

export type Manifest = {
  hash: string;
  src: {
    dependencies: KeyMap,
    locals: {
      [key: string]: {
        path: string,
        hash: string
      }
    }
  }
};

export type ScoringType = 'weighted';

export const WEIGHTED: ScoringType = 'weighted';
