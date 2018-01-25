import { allApps } from './load-app';
import { removeFiles } from './common';
import { buildLogger } from 'log-factory';

const logger = buildLogger();

export async function clean(dir: string): Promise<string[]> {
  const files = allApps().reduce((acc, a) => acc.concat(a.generatedFiles || []), []);
  const allFiles = ['.pie'].concat(files);

  logger.debug('allFiles:', allFiles);
  return removeFiles(dir, allFiles);
}
