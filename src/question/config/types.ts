import { readJsonSync } from 'fs-extra';
import { FileNames } from './index';
import { SessionArray } from '../session';

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

export function fromPath<T>(filepath: string): T {
  if (filepath.endsWith('.js')) {
    return loadObjectFromJsFile(filepath) as T;
  } else if (filepath.endsWith('.json')) {
    return readJsonSync(filepath) as T;
  }
}

export const sessionFromPath = (dir, names: FileNames): SessionArray => {
  return fromPath<SessionArray>(names.resolveSession(dir));
};

export let configFromPath = (dir, names: FileNames): RawConfig => {
  return fromPath<RawConfig>(names.resolveConfig(dir));
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
