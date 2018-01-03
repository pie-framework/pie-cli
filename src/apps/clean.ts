import { allApps } from './load-app';
import { removeFiles } from './common';

export async function clean(dir: string): Promise<string[]> {
  const files = allApps().reduce((acc, a) => acc.concat(a.generatedFiles || []), []);
  const allFiles = ['.pie'].concat(files);
  return removeFiles(dir, allFiles);
}
