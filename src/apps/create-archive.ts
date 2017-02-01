import * as archiver from 'archiver';
import { existsSync, readFileSync, createWriteStream } from 'fs-extra';
import { buildLogger } from '../log-factory';
import { join } from 'path';
import * as _ from 'lodash';

export { archiver };

const logger = buildLogger();
export function archiveIgnores(dir: string) {
  let gitIgnorePath = join(dir, '.gitignore');
  let gitIgnores = existsSync(gitIgnorePath) ? readFileSync(gitIgnorePath, 'utf8').split('\n').map(s => s.trim()) : [];

  return _(gitIgnores).concat([
    'node_modules/**',
    'controllers/**',
    '\.*',
    'package.json',
    '*.tar.gz'
  ]).uniq().value();
}

export function createArchive(
  name: string,
  cwd: string,
  ignore: string[],
  addExtras: (any) => void): Promise<string> {
  return new Promise<string>((resolve, reject) => {

    let archiveName = name.endsWith('.tar.gz') ? name : `${name}.tar.gz`;

    let output = createWriteStream(archiveName);
    let archive = archiver('tar', { gzip: true });

    output.on('close', function () {
      logger.debug(archiveName, (archive as any).pointer() + ' total bytes');
      resolve(archiveName);
    });

    archive.on('error', function (err) {
      reject(err);
    });

    archive.pipe(output);

    archive.glob('**', {
      cwd: cwd,
      ignore: ignore,
    });

    addExtras(archive);

    archive.finalize();
  });
}