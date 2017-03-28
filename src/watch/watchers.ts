import * as _ from 'lodash';
import * as chokidar from 'chokidar';
import * as touch from 'touch';

import { Stats, copy, existsSync, remove, statSync } from 'fs-extra';
import { join, relative, resolve } from 'path';

import { Dirs } from '../install';
import { buildLogger } from 'log-factory';

const logger = buildLogger();

type Info = { path: string, stat: Stats };

interface Roots {
  srcRoot: string;
  targetRoot: string;
}


/**
 * Note: There appears to be a bug in the new webpack where simply copying a file that sits in a
 * dependency graph won't push the changes through. Adding a `touch` to force it through.
 * TODO: try and recreate the issue in a sample project:
 * @see https://github.com/PieLabs/pie-cli/issues/99
 * @param path - the path to copy
 * @param dest - the destination
 */
const copyThenTouch = (path, dest) => {
  logger.silly(`copy ${path} -> ${dest}`);
  copy(path, dest, (e) => {
    if (!e) {
      logger.silly(`touch ${dest}`);
      setTimeout(() => {
        touch(dest, err => {
          if (err) {
            logger.error(err);
          }
        });
      }, 10);
    } else {
      logger.error(e.toString());
    }
  });
};

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
      // awaitWriteFinish: {
      //   pollInterval: 100,
      //   stabilityThreshold: 2000,
      // },
      ignoreInitial: true,
      ignored: _.concat(this.ignores, [
        /package\.json/,
        /[\/\\]\./,
        /.*node_modules.*/,
        /\.git.*/,
        /.*docs.*/,
        /.*\.d\.ts/,
        /typings/,
        /.*\.log$/,
        /tsconfig\.json/,
        /jsconfig\.json/,
        /\/test\//
      ]),
      persistent: true
    });


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
      this.copyOnceIfNeeded(this.watcher.getWatched());
    };

    this.watcher
      .on('add', onAdd)
      .on('change', onChange)
      .on('unlink', onUnlink)
      .on('error', onError)
      .on('ready', onReady);
  }

  /**
   * Inspect the chokidar watched object.
   * If the watched file is significantly newer than it's target, copy it across.
   * This handles the scenario when the target has already been built, but the src has changed.
   * This only happens at the start, thereafter the chokidar watching kicks in.
   * Note:
   *   `chokidar.opts.ignoreInitial: false`
   *   was tried but it causes webpack compile errors - maybe it happens too soon?
   * @param watched
   */
  private copyOnceIfNeeded(watched: chokidar.WatchedPaths): void {

    const slim = (src: Info, dest: Info) => {
      const destMtime = dest.stat ? dest.stat.mtime.getTime() : 0;
      const diff = src.stat.mtime.getTime() - destMtime;
      return {
        dest: dest.path,
        diff,
        src: src.path,
      };
    };

    /**
     * If the src is more than 5 seconds newer than the installed file then its considered a user change
     * that needs to go across.
     */
    const AGE = 5000;
    const newFiles = _.reduce(watched, (acc, arr, key) => {
      const files = arr
        .map(n => join(key, n))
        .map(n => {
          return { path: n, stat: statSync(n) };
        })
        .filter(o => o.stat.isFile())
        .map(o => {
          const path = this.getDestination(o.path);
          const stat = existsSync(path) ? statSync(path) : null;
          return slim(o, { path, stat });
        })
        .filter(({ diff }) => diff > AGE);
      return acc.concat(files);
    }, []);

    logger.debug('files that need to be copied over: ', newFiles);

    // we have to wait a short while before copying? webpack issue?
    setTimeout(() => {
      _.forEach(newFiles, f => copyThenTouch(f.src, f.dest));
    }, 1000);
  }
}

export class PackageWatch extends BaseWatch {
  constructor(private name: string,
    readonly pkgDir: string,
    readonly targetDir: string,
    ignore: (string | RegExp)[] = []) {
    super(ignore);
  }

  get srcRoot() {
    return this.pkgDir;
  }

  get targetRoot() {
    return resolve(join(this.targetDir, 'node_modules', this.name));
  }
}

/**
 * TODO: These watches below should not be hard coding the expected name of the lib.
 */
export class PieConfigureWatch extends BaseWatch {

  constructor(private pkgDir: string, private targetDir: string, private moduleName: string) {
    super([]);
  }

  get srcRoot() {
    return resolve(join(this.pkgDir, 'configure'));
  }

  get targetRoot() {
    return resolve(join(this.targetDir, `node_modules`, this.moduleName));
  }
}

export class PieControllerWatch extends BaseWatch {

  constructor(private pkgDir: string, private targetDir: string, private moduleName: string) {
    super([]);
  }

  get srcRoot() {
    return resolve(join(this.pkgDir, 'controller'));
  }

  get targetRoot() {
    return resolve(join(this.targetDir, `node_modules`, this.moduleName));
  }
}

export class PieWatch {

  private client;
  private controller;
  private configure;
  constructor(
    name: string,
    pieItemDir: string,
    relativePath: string,
    installDirs: Dirs,
    targets: { controller: string, configure: string }) {
    logger.debug('[PieWatch] constructor: ', name, relativePath, pieItemDir, installDirs, targets);
    const pkgDir = resolve(join(pieItemDir, relativePath));
    this.client = new PackageWatch(name, pkgDir, installDirs.root, [/.*controller.*/, /.*configure.*/]);
    this.controller = new PieControllerWatch(pkgDir, installDirs.controllers, targets.controller);

    if (targets.configure) {
      this.configure = new PieConfigureWatch(pkgDir, installDirs.configure, targets.configure);
    }
  }

  public start() {
    this.client.start();
    this.controller.start();
    if (this.configure) {
      this.configure.start();
    }
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
