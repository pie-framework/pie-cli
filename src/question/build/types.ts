import { KeyMap } from '../../npm/types';

export interface Build {
  install(name: string, deps: KeyMap, devDeps: KeyMap): Promise<void>;
}