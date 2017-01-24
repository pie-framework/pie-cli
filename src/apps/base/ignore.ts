import { existsSync, readFileSync } from 'fs-extra';
import { join } from 'path';
import * as _ from 'lodash';
import * as glob from 'glob';

let defaultIgnores = [
  'package.json',
  'node_modules/**',
  'controllers/**',
  '\.*',
  '*.tar.gz',
  '*.zip'
];

let gitIgnores = (dir: string) => {
  if (existsSync(join(dir, '.gitignore'))) {
    let contents = readFileSync(join(dir, '.gitignore'), 'utf8');
    return contents.split('\n').map(s => s.trim())
  } else {
    return [];
  }
}

export default class Ignore {

  readonly ignores: string[];

  constructor(readonly dir: string, ignoresIn: string[] = defaultIgnores) {
    this.ignores = _(ignoresIn)
      .concat(gitIgnores(dir))
      .uniq()
      .value();
  }

  get files(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      glob('**', { cwd: this.dir, ignore: this.ignores }, (err, files) => {
        if (err) {
          reject(err);
        } else {
          resolve(files);
        }
      });
    });
  }
}