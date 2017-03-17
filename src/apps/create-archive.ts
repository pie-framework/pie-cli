import * as _ from 'lodash';
import * as archiver from 'archiver';

import { createWriteStream, existsSync, readFileSync } from 'fs-extra';

import { buildLogger } from 'log-factory';
import { join } from 'path';

export { archiver };

const logger = buildLogger();

export function archiveIgnores(dir: string) {
  const gitIgnorePath = join(dir, '.gitignore');
  const gitIgnores = existsSync(gitIgnorePath) ?
    readFileSync(gitIgnorePath, 'utf8').split('\n').map(s => s.trim()) : [];

  return _(gitIgnores).concat([
    '.pie',
    '\.*',
    'package.json',
    '*.tar.gz'
  ]).uniq().value();
}

export function createArchive(
  name: string,
  cwd: string,
  ignore: string[],
  addExtras: (a: any) => void): Promise<string> {
  return new Promise<string>((resolve, reject) => {

    const archiveName = name.endsWith('.tar.gz') ? name : `${name}.tar.gz`;

    const output = createWriteStream(archiveName);
    const archive = archiver('tar', { gzip: true });

    output.on('close', () => {
      logger.debug(archiveName, (archive as any).pointer() + ' total bytes');
      resolve(archiveName);
    });

    archive.on('error', (err) => {
      reject(err);
    });

    archive.pipe(output);

    archive.glob('**', { cwd, ignore });

    addExtras(archive);

    archive.finalize();
  });
}