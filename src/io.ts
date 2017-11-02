import * as readline from 'readline';

import { buildLogger } from 'log-factory';
import * as child_process from 'child_process';

const logger = buildLogger();

const windowsSpawn = (executable, args, options) => {
  logger.debug('>>>> running windows cmd');
  return child_process.spawn(process.env.comspec || "cmd.exe", ["/c", executable].concat(args), options);
};

const spawn = (process.platform === "win32") ? windowsSpawn : child_process.spawn;

export function spawnPromise(
  cmd: string,
  cwd: string,
  args: string[],
  ignoreExitCode: boolean = false): Promise<{ stdout: string }> {

  logger.debug('[_spawnPromise] args: ', `${cmd} ${args.join(' ')}`);

  const p: Promise<{ stdout: string }> = new Promise((resolve, reject) => {

    const s = spawn(cmd, args, { cwd });

    let out = '';

    s.on('error', (e) => {
      logger.error('npm install command failed - is npm installed?');
      reject(e);
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
        reject(new Error(`cmd: '${cmd} ${args.join(' ')}', error code: ${code}`));
      } else {
        resolve({ stdout: out });
      }
    });
  });

  p.catch(e => {
    logger.error(`Error running cmd: ${args}, ${e.message}`);
    return e;
  });
  return p;
}
