import { KeyMap } from '../../npm';
import { readJsonSync } from 'fs-extra';

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

export let fromPath = (p: string): RawConfig => {
  return readJsonSync(p) as RawConfig;
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
