import * as crypto from 'crypto';
import * as fs from 'fs-extra';
import * as path from 'path';

import NpmDir from './npm-dir';

export { NpmDir }
export type KeyMap = { [key: string]: string };


export let pathIsDir = (root, v) => {
  try {
    const resolved = path.resolve(root, v);
    const stat = fs.lstatSync(resolved);
    return stat.isDirectory();
  } catch (e) {
    return false;
  }
};

export let hash = (s: string) => crypto.createHash('md5').update(s).digest('hex');
