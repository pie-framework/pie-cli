
import NpmDir from '../../npm/npm-dir';
import { KeyMap } from '../../npm/types';
import { JsonConfig } from '../../question/config';
import * as _ from 'lodash';
import { join } from 'path';
import buildDependencies from './build-dependencies';
import baseConfig from './base-config';
import { LoaderInfo } from '../../framework-support/support-info';
import { writeFileSync } from 'fs-extra';
import { build as buildWebpack, BuildResult } from '../../code-gen/webpack-builder';
import * as webpack from 'webpack';
import { buildLogger } from '../../log-factory';
import { writeConfig } from '../../code-gen/webpack-write-config';

const logger = buildLogger();

export default class ClientBuild {

  private npmDir: NpmDir;

  constructor(private config: JsonConfig, readonly loaders: LoaderInfo[], private writeWebpackConfig: boolean) {
    this.npmDir = new NpmDir(this.config.dir);
  }

  private get clientDevDeps() {
    return _.merge(buildDependencies, {
      'style-loader': '^0.13.1',
      'css-loader': '^0.25.0'
    });
  }

  async install(deps: KeyMap, devDeps: KeyMap): Promise<void> {
    deps = _.merge(this.config.dependencies, deps);
    devDeps = _.merge(devDeps, this.clientDevDeps);
    await this.npmDir.install('tmp-client-package', deps, devDeps);
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
    let config = _.extend({
      context: this.config.dir,
      entry: this.entryJsPath,
      output: { filename: fileout, path: this.config.dir }
    }, baseConfig(this.config.dir));

    let m = config.module as any;
    m.loaders = (m.loaders || []).concat(this.loaders);

    if (this.writeWebpackConfig) {
      writeConfig(join(this.config.dir, '.client.webpack.config.js'), config);
    }

    return config;
  }
}