import { buildLogger } from '../log-factory';
import chokidar from 'chokidar';
import { relative, resolve, join } from 'path';
import _ from 'lodash';
import fs from 'fs-extra';

const logger = buildLogger();

export class LocalWatch {

  constructor(name, relativePath, rootDir) {
    logger.info('constructor: ', name, relativePath, rootDir);
    this.name = name;
    this.relativePath = relativePath;
    this.rootDir = rootDir;
  }

  get resolvedPath() {
    return resolve(join(this.rootDir, this.relativePath));
  }

  get targetRoot() {
    return resolve(join(this.rootDir, 'node_modules', this.name));
  }

  getDestination(path) {
    let relativePath = relative(this.rootDir, path);
    let destination = join(this.targetRoot, 'node_modules', this.name, relativePath);
    logger.silly(`[getDestination], path: ${path}, destination: ${destination}`);
    return destination;
  }

  start() {

    /** 
     * TODO: How do we configure what to watch for client + controller?
     * Option: use webpack stats to find out which files are needed: could mean that we'd have to recompile webpack if something is added?
     * 
     * For now allow the src to be specified in `dependencies.json`?
     * 
     * {
     *   corespring-multiple-choice-react: {
     *     client: src,
     *     controller: /
     *   }
     * }
     */

    this._watcher = chokidar.watch(this.resolvedPath, {
      ignored: [
        /package\.json/,
        /[\/\\]\./,
        /.*node_modules.*/,
        /\.git.*/,
        /.*docs.*/,
        /.*\.d\.ts/,
        /typings/,
        /jsconfig\.json/
      ],
      ignoreInitial: true,
      persistent: true
    });


    let onAdd = (path, stats) => {
      logger.info(`File added: ${path} - copy`);
      fs.copy(path, this.getDestination(path));
    };

    let onChange = (path, stats) => {
      logger.debug(`File changed: ${path} - copy`);
      fs.copy(path, this.getDestination(path));
    }

    let onUnlink = (path) => {
      logger.debug(`File unlinked: ${path} - delete`);
      fs.remove(this.getDestination(path));
    }

    let onError = (e) => logger.error(e);
    let onReady = () => {
      logger.info(`Watcher for ${this.resolvedPath} - Ready`);
      logger.info(this._watcher.getWatched());
    }

    this._watcher
      .on('add', onAdd)
      .on('change', onChange)
      .on('unlink', onUnlink)
      .on('error', onError)
      .on('ready', onReady);
  }
}

export function init(questionConfig) {

  logger.debug('[init] questionConfig: ', questionConfig.localDependencies);

  let watchers = _.map(questionConfig.localDependencies, (value, key) => {
    return new LocalWatch(key, value, questionConfig.dir);
  });

  _.forEach(watchers, w => w.start());

  return watchers;
}