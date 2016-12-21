import { KeyMap } from '../../npm/types';

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
}
