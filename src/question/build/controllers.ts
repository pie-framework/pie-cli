import NpmDir from '../../npm/npm-dir';
import { JsonConfig } from '../../question/config';
import { join, relative } from 'path';
import { buildLogger } from '../../log-factory';
import { PiePackage } from '../../question/config/elements';
import * as _ from 'lodash';
import { ensureDirSync } from 'fs-extra';
import baseConfig from './base-config';
import { writeFileSync } from 'fs-extra';
import { build as buildWebpack, BuildResult } from '../../code-gen/webpack-builder';
import * as webpack from 'webpack';
import { writeConfig } from '../../code-gen/webpack-write-config';

const logger = buildLogger();

const CONTROLLERS_DIR = 'controllers';

export default class ControllersBuild {

  private npmDir: NpmDir;

  constructor(private config: JsonConfig, private writeWebpackConfig: boolean) {
    ensureDirSync(this.controllersDir);
    this.npmDir = new NpmDir(this.controllersDir);
  }

  private get controllersDir() {
    return join(this.config.dir, CONTROLLERS_DIR);
  }

  private get controllerDependencies(): { [key: string]: string } {
    let out = _.reduce(this.config.installedPies, (acc, p: PiePackage) => {
      let modulePath = relative(this.controllersDir, p.controllerDir);
      acc[p.key] = modulePath;
      return acc;
    }, {});
    logger.silly('[get dependencies] out: ', out);
    return out;
  }

  async install(force: boolean): Promise<void> {
    //Note: We need to install using the *-controller name.
    let installDependencies = _.mapKeys(this.controllerDependencies, (value, key) => `${key}-controller`);
    await this.npmDir.install('tmp-controllers-package', installDependencies, {}, force);
  }

  get entryJs() {
    let src = _.map(this.controllerDependencies, (value, key: string) => {
      return `
         exports['${key}'] = require('${key}-controller');
         exports['${key}'].version = '${value}';
         `;
    });
    return src.join('\n');
  }

  get entryJsPath(): string {
    return './.controllers.entry.js';
  }

  async build(fileout: string, libraryName: string): Promise<string> {
    writeFileSync(join(this.controllersDir, this.entryJsPath), this.entryJs, 'utf8');
    let config = this._config(fileout, libraryName);
    logger.silly('config', config);
    let buildResult = await buildWebpack(config);
    return fileout;
  }

  private _config(fileout: string, libraryName: string) {
    let config = _.extend({
      context: this.controllersDir,
      entry: this.entryJsPath,
      output: {
        filename: fileout, path: this.config.dir,
        library: libraryName,
        libraryTarget: 'umd'
      }
    }, baseConfig(this.controllersDir));

    if (this.writeWebpackConfig) {
      writeConfig(join(this.config.dir, '.controllers.webpack.config.js'), config);
    }

    return config;
  }
}
