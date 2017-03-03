import { spawn } from 'child_process';
import * as readline from 'readline';
import { buildLogger } from 'log-factory';

let logger = buildLogger();

export function spawnPromise(
  cmd: string,
  cwd: string,
  args: string[],
  ignoreExitCode: boolean = false): Promise<{ stdout: string }> {

  logger.debug('[_spawnPromise] args: ', args);

  let p = new Promise((resolve, reject) => {

    let s = spawn(cmd, args, { cwd: cwd });

    let out = '';

    s.on('error', () => {
      logger.error('npm install command failed - is npm installed?');
      reject();
    });

    readline.createInterface({
      input: s.stderr,
      terminal: false
    }).on('line', (line) => {
      //@see: https://github.com/npm/npm/issues/13656 an issue w/ npm 3.10.7
      let eventEmitterWarning = 'Possible EventEmitter memory leak detected';
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
  return p;
};

