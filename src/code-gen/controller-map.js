//@flow 
import fs from 'fs-extra';
import path from 'path';
import { buildLogger } from '../log-factory';
import _ from 'lodash';
import { removeFiles } from '../file-helper';
import NpmDir from '../npm/npm-dir';
import webpack from 'webpack';
import resolve from 'resolve';
import { writeConfig } from './webpack-write-config';
import { dependenciesToHash } from '../npm/dependency-helper';
import Question from '../question';

const logger = buildLogger();

export let DEFAULT_OPTS = (outputDir: string) => {
  return {
    controllersFilename: 'controllers-map.js',
    outputDir: outputDir
  };
}

export const NPM_DEPENDENCIES = {
  'babel-core': '^6.17.0',
  'babel-loader': '^6.2.5'
}

/**
 * Exports a controller map to: `window[uid]`.
 * Where `uid` is a hash of the dependencies object's key/values.
 * The object will contain a map of controllers accessible via: 
 * ```
 * window[uid][controllerName] //=> { version: '', model: Function, outcome: Function }
 * //eg: 
 * window['xxxxxxxxx']['my-pie'].model([], {}, {}).then(function(result){ console.log(result); });
 * ```
 */
export function build(question: Question, opts: any) {

  opts = _.extend({}, DEFAULT_OPTS(question.dir), opts);

  let controllerPath = path.join(question.dir, 'controllers');
  fs.ensureDirSync(controllerPath);

  logger.silly('[build] controllerPath', controllerPath);

  let controllerNpmDir = new NpmDir(controllerPath);

  let dependencies = _.reduce(question.pies, (acc, p) => {
    let pieControllerDir = path.join(p.installedPath, 'controller');
    if (fs.existsSync(pieControllerDir)) {
      let modulePath = path.relative(controllerPath, pieControllerDir);
      acc[p.name] = modulePath;
    } else {
      logger.warn('[build] the following path doesnt exist: ', pieControllerDir);
    }

    return acc;
  }, {});

  let uid = dependenciesToHash(dependencies);

  logger.debug('dependencies:', dependencies, 'uid: ', uid);

  let finalDependencies = _.extend({}, dependencies, NPM_DEPENDENCIES);

  logger.silly('[build] finalDependncies', finalDependencies);

  let writeEntryJs = () => {
    //TODO: hardcoding to x-controller here - is that safe?
    let entrySrc = _.map(dependencies, (value, key) => {
      return `exports['${key}'] = require('${key}-controller');
exports['${key}'].version =  '${value}';`
    });

    fs.writeFileSync(path.join(controllerPath, 'entry.js'), entrySrc.join('\n'), { encoding: 'utf8' });
    return Promise.resolve();
  }

  let runWebpack = () => {

    let config = {
      context: controllerPath,
      entry: path.join(controllerPath, 'entry.js'),
      output: {
        path: opts.outputDir,
        filename: opts.controllersFilename,
        library: uid,
        libraryTarget: 'umd'
      },
      resolve: {
        root: path.resolve(path.join(controllerPath, 'node_modules'))
      },
      resolveLoader: {
        root: path.resolve(path.join(controllerPath, 'node_modules'))
      }
    };

    writeConfig(path.join(controllerPath, 'webpack.config.js'), config);

    return new Promise((resolve, reject) => {
      webpack(config, (err, stats) => {
        if (err) {
          reject(err);
        } else if (stats.compilation.errors.length > 0) {
          _.forEach(stats.compilation.errors, (e) => logger.error(e));
          reject(new Error('Webpack build errors - see log'));
        } else {
          resolve({
            dir: config.output.path,
            filename: config.output.filename,
            path: path.join(config.output.path, config.output.filename),
            library: uid
          });
        }
      });
    });
  }

  return controllerNpmDir.install(finalDependencies)
    .then(writeEntryJs)
    .then(runWebpack)
    .then((result) => {
      logger.info(`controller-map with uid: ${uid} written to: ${result.path}!`);
      return result;
    })
    .catch((e) => logger.error(e));
}

export function clean(root: string, bundleName: string) {
  return removeFiles(root, ['controllers', bundleName]);
}