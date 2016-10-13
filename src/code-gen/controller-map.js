import fs from 'fs-extra';
import path from 'path';
import { buildLogger } from '../log-factory';
import _ from 'lodash';
import { removeFiles } from '../file-helper';
import NpmDir from '../npm/npm-dir';
import webpack from 'webpack';

const logger = buildLogger();

/**
 * Exports a controller map to: `window.pie.controllerMap`,
 * Where the map contains the logic for each pie. Each piece of logic is stored using the name of the pie.
 * eg: 
 * 
 * window.pie.controllerMap['my-pie'].model([], {}, {}).then(function(result){ console.log(result); });
 * 
 * //TODO: make this configurable?
 */
export function build(question) {

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

  dependencies = _.extend({}, dependencies, {
    'babel-loader': '^6.2.5',
    'babel-preset-es2015': '^6.16.0'
  });

  logger.silly('[build] dependncies', dependencies);

  let writeEntryJs = () => {
    let entryJs = `//todo`;
    fs.writeFileSync(path.join(controllerPath, 'entry.js'), entryJs, { encoding: 'utf8' });
    return Promise.resolve();
  }

  let runWebpack = () => {

    let config = {
      context: controllerPath,
      entry: path.join(controllerPath, 'entry.js'),
      output: {
        path: controllerPath,
        filename: 'controller-bundle.js'
      },
      module: {
        loaders: [
          {
            test: /\.js$/,
            loader: 'babel-loader',
            query: {
              presets: ['babel-preset-es2015']
            }
          }
        ]
      }
    };

    return new Promise((resolve, reject) => {
      webpack(config, (err, stats) => {
        if (err) {
          reject(err);
        } else if (stats.compilation.errors.length > 0) {
          _.forEach(stats.compilation.errors, (e) => logger.error(e));
          reject(new Error('Webpack build errors - see log'));
        } else {
          resolve(config.output.filename);
        }
      });
    });
  }

  return controllerNpmDir.install(dependencies)
    .then(writeEntryJs)
    .then(runWebpack)
    .then(() => {
      logger.info('controller-map done!');
    })
    .catch((e) => logger.error(e));
}

export function clean(root, bundleName) {
  return removeFiles(root, [bundleName]);
}