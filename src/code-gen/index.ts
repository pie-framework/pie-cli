import * as webpack from 'webpack';

import { BuildFn, BuildResult, build as buildWebpack } from './webpack-builder';
import { utimes, writeFile } from 'fs-extra';

import { pascalCase } from 'change-case';
import { writeConfig } from './webpack-write-config';

export { buildWebpack, writeConfig }
export {BuildResult, BuildFn}

export {webpack}
export interface Declaration {
  key: string;
  js: string;
}

export class ElementDeclaration implements Declaration {
  constructor(readonly tag: string, readonly path?: string) {
    this.path = this.path || this.tag;
  }

  get key() {
    return this.tag;
  }

  get js() {
    const comp = pascalCase(this.tag);
    return `import ${comp} from '${this.path}';
    customElements.define('${this.tag}', ${comp});`.split('\n').map(s => s.trim()).join('\n');
  }
}

function writeFilePromise(path: string, content: string): Promise<{}> {
  return new Promise((resolve, reject) => {
    writeFile(path, content, 'utf8', (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function adjustUTimes(path: string, ageInSeconds: number) {
  return new Promise((resolve, reject) => {
    const now = Date.now() / 1000;
    const then = now - ageInSeconds;
    utimes(path, then, then, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

/**
 * Write the entry js - backdate the file's mtime to avoid the following issue:  
 * https://github.com/webpack/watchpack/issues/25
 * 
 * @param path 
 * @param js 
 */
export function writeEntryJs(path: string, js: string): Promise<{}> {
  return writeFilePromise(path, js)
    .then(() => adjustUTimes(path, 10));
}
