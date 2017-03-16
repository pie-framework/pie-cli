import * as readline from 'readline';

import { buildLogger } from 'log-factory';
import { spawn } from 'child_process';

const logger = buildLogger();

export function spawnPromise(
  cmd: string,
  cwd: string,
  args: string[],
  ignoreExitCode: boolean = false): Promise<{ stdout: string }> {

  logger.debug('[_spawnPromise] args: ', args);

  const p = new Promise((resolve, reject) => {

    const s = spawn(cmd, args, { cwd });

    let out = '';

    s.on('error', () => {
      logger.error('npm install command failed - is npm installed?');
      reject();
    });

    readline.createInterface({
      input: s.stderr,
      terminal: false
    }).on('line', (line) => {
      // @see: https://github.com/npm/npm/issues/13656 an issue w/ npm 3.10.7
      const eventEmitterWarning = 'Possible EventEmitter memory leak detected';
      if (line.indexOf(eventEmitterWarning) !== -1) {
        logger.silly(line);
      } else {
        logger.error(line);
      }
    });

    readline.createInterface({
      input: s.stdout,
      terminal: false
    }).on('line', (line) => {
      logger.silly(line);
      out += line;
    });

    s.on('close', (code) => {
      if (code !== 0 && !ignoreExitCode) {
        logger.error(args + ' failed. code: ' + code);
        reject();
      } else {
        resolve({ stdout: out });
      }
    });
  });

  p.catch(e => {
    logger.error(`Error running cmd: ${args}, ${e.message}`);
  });
  return p;
};
