import * as archiver from 'archiver';
import * as fs from 'fs-extra';
import * as _ from 'lodash';
import { basename, extname, relative } from 'path';

import { buildLogger } from './log-factory';

const logger = buildLogger();

export type ArchiveEntry = { name: string, content: string };

export enum Mode {
  Zip = 1,
  Tar
}

const extensions: Map<Mode, string> = new Map([
  [Mode.Zip, 'zip'],
  [Mode.Tar, 'tar.gz']
]);

/**
 * @param archiveName - the name of the archive 
 * @param paths - the paths to add.
 * 
 * For each path 
 *  - check that it exists - if not we ???
 *  - if it's a dir - add all the dir contents
 *  - if it's a file add the file
 */
let mkArchive = (root: string, archiveName: string, entries: (string | ArchiveEntry)[], mode: Mode = Mode.Tar): Promise<string> => {

  return new Promise((resolve, reject) => {
    //ensure the archive is correctly named to match the mode.
    archiveName = `${archiveName.split('.')[0]}.${extensions.get(mode)}`;

    let output = fs.createWriteStream(archiveName);

    let archive = (mode === Mode.Tar) ? archiver('tar', { gzip: true }) : archiver('zip');


    output.on('close', function () {
      logger.debug((archive as any).pointer() + ' total bytes');
      logger.debug('archiver has been finalized and the output file descriptor has closed.');
      resolve(archiveName);
    });

    archive.on('error', function (err) {
      reject(err);
    });

    archive.pipe(output);

    let isArchiveEntry = (p: any): p is ArchiveEntry => p.name && p.content;

    _.forEach(entries, p => {
      logger.debug('entry: ', p);
      if (typeof p === 'string') {
        if (fs.existsSync(p)) {
          let stat = fs.statSync(p);
          if (stat.isFile()) {
            logger.debug(`add file: ${p} `);
            let r = relative(root, p);
            logger.debug('relative: ', r);
            (archive as any).file(p, { name: r });
          } else if (stat.isDirectory()) {
            logger.debug(`add dir: ${p} `);
            (archive as any).glob(`${relative(root, p)}/**`, { cwd: root });
          }
        } else {
          logger.warn(`missing file: ${p}`);
        }
      } else if (isArchiveEntry(p)) {
        archive.append(p.content, { name: p.name });
      }
    });

    archive.finalize();
  });
}

export default mkArchive;