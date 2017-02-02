import { App, BuildOpts, ManifestOpts, ServeOpts } from '../types';
import { JsonConfig } from '../../question/config';
import ClientBuild from '../../question/build/client';
import ControllersBuild from '../../question/build/controllers';
import { ElementDeclaration, Declaration } from '../../code-gen/declaration';
import { buildLogger } from '../../log-factory';
import { SupportConfig } from '../../framework-support';
import * as _ from 'lodash';
import { join, resolve } from 'path';
import * as pug from 'pug';
import { existsSync, writeFileSync, writeJsonSync, readJsonSync, readFileSync } from 'fs-extra';
import * as jsesc from 'jsesc';
import { install as bowerInstall } from './bower';
import loadSchemas from './schema-loader';
import * as webpack from 'webpack';
import * as webpackMiddleware from 'webpack-dev-middleware';
import * as express from 'express';
import { BaseApp, Tag, Out, Names, Compiler, build as buildApp, getNames } from '../base';
import { ReloadOrError, HasServer } from '../server/types';
import * as http from 'http';

const logger = buildLogger();
const templatePath = join(__dirname, 'views/index.pug');

export default class InfoApp extends BaseApp {

  static build(args: any, loadSupport: (JsonConfig) => Promise<SupportConfig>): Promise<App> {

    let dir = resolve(args.dir || process.cwd());
    if (!existsSync(join(dir, 'docs/demo'))) {
      throw new Error(`Can't find a 'docs/demo' directory in path: ${dir}. Is this a pie directory?`);
    }
    let config = new JsonConfig(join(dir, 'docs/demo'));
    return loadSupport(config)
      .then(s => {
        return new InfoApp(args, dir, config, s, getNames(args));
      })
  }

  private template: pug.compileTemplate;

  constructor(args: any, private pieRoot: string, config: JsonConfig, support: SupportConfig, names: Names) {
    super(args, config, support, names);
    this.template = pug.compileFile(templatePath, { pretty: true });
  }

  protected async install(forceInstall: boolean): Promise<void> {
    logger.silly(`[install] forceInstall: ${forceInstall}`);
    await super.install(forceInstall);
    logger.silly('[install] bower install...');
    await bowerInstall(this.config.dir, ['PieLabs/pie-component-page#update']);
  }

  protected mkServer(app: express.Application): ReloadOrError & HasServer {
    return {
      httpServer: http.createServer(app),
      reload: () => { },
      error: () => { }
    }
  }

  protected get generatedAssets() {
    return _.concat(super.generatedAssets, ['bower_components']);
  }

  protected serverMarkup(): string {
    return this.fileMarkup();
  }

  protected fileMarkup(): string {

    let pkg = readJsonSync(join(this.pieRoot, 'package.json'));
    let readme = readFileSync(join(this.pieRoot, 'README.md'), 'utf8');
    let schemas = loadSchemas(join(this.pieRoot, 'docs/schemas'));

    return this.template({
      js: _.concat(this.support.externals.js || [], [this.names.out.completeItemTag.path]),
      markup: this.names.out.completeItemTag.tag,
      name: pkg.name,
      version: pkg.version,
      repositoryUrl: (pkg.repository || {}).url,
      readme: jsesc(readme),
      schemas: schemas,
      pie: {
        url: '//github.com/PieLabs/pie-docs',
        logo: 'https://encrypted-tbn1.gstatic.com/images?q=tbn:ANd9GcTQsnQyrpApsRrY9KfGY--G9Og4_FQ1gLg3Iimx5_NedfCUevKQtQ'
      }
    });
  }

}
