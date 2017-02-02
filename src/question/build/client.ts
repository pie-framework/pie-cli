
import NpmDir from '../../npm/npm-dir';
import { KeyMap } from '../../npm/types';
import { JsonConfig } from '../../question/config';
import * as _ from 'lodash';
import { join } from 'path';
import buildDependencies from './build-dependencies';
import baseConfig from './base-config';
import { writeFileSync } from 'fs-extra';
import { build as buildWebpack, BuildResult } from '../../code-gen/webpack-builder';
import * as webpack from 'webpack';
import { buildLogger } from '../../log-factory';
import { writeConfig } from '../../code-gen/webpack-write-config';
import { Rule } from 'webpack';
const logger = buildLogger();

export default class ClientBuild {

  private npmDir: NpmDir;

  constructor(private config: JsonConfig, readonly rules: Rule[], private writeWebpackConfig: boolean) {
    this.npmDir = new NpmDir(this.config.dir);
  }

  private get clientDevDeps() {
    return _.merge(buildDependencies, {
      'style-loader': '^0.13.1',
      'css-loader': '^0.25.0'
    });
  }

  async install(deps: KeyMap, devDeps: KeyMap, force: boolean): Promise<void> {
    deps = _.merge(this.config.dependencies, deps);
    devDeps = _.merge(devDeps, this.clientDevDeps);
    await this.npmDir.install('tmp-client-package', deps, devDeps, force);
  }

  get entryJsPath(): string {
    return './.client.entry.js';
  }

  async build(entryJs: string, fileout: string): Promise<string> {
    writeFileSync(join(this.config.dir, this.entryJsPath), entryJs, 'utf8');
    let config = this._config(fileout);
    let buildResult: BuildResult = await buildWebpack(config);
    logger.silly('buildResult: ', buildResult.duration);
    return fileout;
  }

  public webpackConfig(entryJs: string, fileout: string): webpack.Configuration {
    writeFileSync(join(this.config.dir, this.entryJsPath), entryJs, 'utf8');
    return this._config(fileout);
  }

  private _config(fileout: string): webpack.Configuration {

    let override = {
      context: this.config.dir,
      entry: this.entryJsPath,
      output: { filename: fileout, path: this.config.dir },
      resolve: {
        extensions: ['.js', '.jsx']
      }
    }

    let config = _.merge(baseConfig(this.config.dir), override);

    config.module.rules = (config.module.rules || []).concat(this.rules);

    if (this.writeWebpackConfig) {
      writeConfig(join(this.config.dir, '.client.webpack.config.js'), config);
    }

    return config;
  }
}