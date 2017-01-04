import { spawnSync } from 'child_process';
import { statSync, existsSync } from 'fs-extra';
import { join } from 'path';
import { spawnPromise } from './io';

export function isGitRepo(dir: string): boolean {
  let gitDir = join(dir, '.git');
  return existsSync(gitDir) && statSync(gitDir).isDirectory();
}

export async function tag(dir: string): Promise<string> {
  //Note: handle a describe error and return {stdout: undefined}
  let p = spawnPromise('git', dir, ['describe'])
    .catch(e => { return { stdout: undefined } });
  let result = await p;
  return result.stdout ? result.stdout.trim() : undefined;
}

export async function sha(dir: string): Promise<string> {
  let result = await spawnPromise('git', dir, ['rev-parse', 'HEAD']);
  return result.stdout.trim();
}