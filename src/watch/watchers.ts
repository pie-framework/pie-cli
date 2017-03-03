import * as _ from 'lodash';
import * as chokidar from 'chokidar';
import * as touch from 'touch';

import { copy, existsSync, remove } from 'fs-extra';
import { join, relative, resolve } from 'path';

import { buildLogger } from 'log-factory';

const logger = buildLogger();

interface Roots {
  srcRoot: string;
  targetRoot: string;
}

export interface Watch {
  start: () => void;
}

export class BaseWatch implements Roots, Watch {

  public srcRoot: string;
  public targetRoot: string;
  private watcher;
  constructor(private ignores) { }
  public getDestination(path) {
    const relativePath = relative(this.srcRoot, path);
    const destination = join(this.targetRoot, relativePath);
    logger.silly(`[BaseWatch] [getDestination], path: ${path}, 
      relativePath: ${relativePath}, destination: ${destination}`);
    return destination;
  }

  public start(): void {

    logger.debug('[BaseWatch] [start] srcRoot: ', this.srcRoot);

    this.watcher = chokidar.watch(this.srcRoot, {
      ignoreInitial: true,
      ignored: _.concat(this.ignores, [
        /package\.json/,
        /[\/\\]\./,
        /.*node_modules.*/,
        /\.git.*/,
        /.*docs.*/,
        /.*\.d\.ts/,
        /typings/,
        /jsconfig\.json/
      ]),
      persistent: true
    });

    /**
     * Note: There appears to be a bug in the new webpack where simply copying a file that sits in a 
     * dependency graph won't push the changes through. Adding a `touch` to force it through. 
     * TODO: try and recreate the issue in a sample project: 
     * @see https://github.com/PieLabs/pie-cli/issues/99
     * @param path 
     * @param dest 
     */
    const copyThenTouch = (path, dest) => {
      logger.silly(`copy ${path} -> ${dest}`);
      copy(path, dest, (e) => {
        if (!e) {
          logger.silly(`touch ${dest}`);
          setTimeout(() => {
            touch(dest, (e) => {
              if (e) {
                logger.error(e);
              }
            });
          }, 10);
        } else {
          logger.error(e.toString());
        }
      });
    }

    const onAdd = (path) => {
      logger.debug(`File added: ${path} - copy`);
      const dest = this.getDestination(path);
      copyThenTouch(path, dest);
    };

    // TODO: Add file size change detection to prevent unnecessary updates
    const onChange = (path) => {
      logger.debug(`File changed: ${path} - copy`);
      copyThenTouch(path, this.getDestination(path));
    };

    const onUnlink = (path) => {
      logger.debug(`File unlinked: ${path} - delete`);
      remove(this.getDestination(path));
    };

    const onError = (e) => logger.error(e);
    const onReady = () => {
      logger.info(`Watcher for ${this.srcRoot} - Ready`);
      logger.silly('watched: \n', this.watcher.getWatched());
    };

    this.watcher
      .on('add', onAdd)
      .on('change', onChange)
      .on('unlink', onUnlink)
      .on('error', onError)
      .on('ready', onReady);
  }
}


export class PackageWatch extends BaseWatch {
  constructor(private name: string,
    private relativePath: string,
    readonly rootDir: string,
    ignore: (string | RegExp)[] = []) {
    super(ignore);
  }

  get srcRoot() {
    return resolve(this.rootDir, this.relativePath);
  }

  get targetRoot() {
    return resolve(join(this.rootDir, 'node_modules', this.name));
  }
}


export class PieControllerWatch extends BaseWatch {

  constructor(private name, private relativePath, private rootDir) {
    super([]);
  }

  get srcRoot() {
    return resolve(join(this.rootDir, this.relativePath, 'controller'));
  }

  get targetRoot() {
    return resolve(join(this.rootDir, 'controllers', 'node_modules', `${this.name}-controller`));
  }
}

export class PieWatch {

  private client;
  private controller;

  constructor(name, relativePath, rootDir) {
    logger.debug('[PieWatch] constructor: ', name, relativePath, rootDir);
    this.client = new PackageWatch(name, relativePath, rootDir, [/.*controller.*/]);
    this.controller = new PieControllerWatch(name, relativePath, rootDir);
  }

  public start() {
    this.client.start();
    this.controller.start();
  }
}

export class FileWatch implements Watch {
  private watch;
  constructor(readonly filepath, readonly onChange: (n: string) => void) {
  }

  public start() {
    logger.silly('[FileWatch] filepath: ', this.filepath);

    this.watch = chokidar.watch(this.filepath, { ignoreInitial: true });
    this.watch.on('change', () => {
      logger.silly('[FileWatch] on change: ', this.filepath);
      this.onChange(this.filepath);
    });

    this.watch.on('ready', () => {
      logger.silly('[FileWatch] ready for path: ', this.filepath);
    });
  }
}
