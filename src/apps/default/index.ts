import { App, BuildOpts, BuildResult, ManifestOpts } from '../types';
import { BaseApp, logBuild, Tag, Out, Names, Compiler, build as buildApp } from '../base';
import { join, resolve, basename } from 'path';
import { SupportConfig } from '../../framework-support';
import { JsonConfig, ElementDeclaration, Declaration } from '../../question/config';
import { ReloadOrError, HasServer } from '../server/types';
import DefaultAppServer from './server';
import { stripMargin } from '../../string-utils';
import { buildLogger } from 'log-factory';
import * as pug from 'pug';
import * as express from 'express';
import * as webpackMiddleware from 'webpack-dev-middleware';
import * as _ from 'lodash';

const logger = buildLogger();

const basicExample = join(__dirname, 'views/example.pug');
const exampleWithSock = join(__dirname, 'views/example-with-sock.pug');

export default class DefaultApp extends BaseApp {

  static build(args: any, loadSupport: (JsonConfig) => Promise<SupportConfig>): Promise<DefaultApp> {
    return buildApp(
      args,
      loadSupport,
      (c: JsonConfig, s: SupportConfig, n: Names) => new DefaultApp(args, c, s, n))
  }

  private templates: { basic: pug.compileTemplate, withSock: pug.compileTemplate }

  private defaultOpts: { includeComplete: boolean };

  constructor(args: any, config: JsonConfig, support: SupportConfig, names: Names) {
    super(args, config, support, names);
    this.templates = {
      basic: pug.compileFile(basicExample, { pretty: true }),
      withSock: pug.compileFile(exampleWithSock, { pretty: true })
    }
    this.defaultOpts = {
      includeComplete: args.c || args.includeComplete || false
    }
  }

  protected get buildSteps() {
    let steps = [
      { label: this.names.out.viewElements, fn: this.buildPie },
      { label: this.names.out.controllers, fn: this.buildControllers }
    ];

    if (this.defaultOpts.includeComplete) {
      steps = steps.concat(super.buildSteps)
    }
    return steps;
  }

  private async buildPie(): Promise<[string]> {

    logger.silly('config: ', this.config);

    let declarations = _.concat([
      new ElementDeclaration('pie-player'),
      new ElementDeclaration('pie-control-panel'),
      new class D implements Declaration {
        get key() {
          return 'pie-controller-global-init';
        }
        get js() {
          return stripMargin`|
          |window.pie = window.pie || {};
          |window.pie.Controller = require('pie-controller');
          |`
        }
      }
    ], this.config.declarations);

    let src = this.allInOneBuild.js(declarations);
    let out = await this.allInOneBuild.client.build(src, this.names.out.viewElements);
    return [out];
  }

  private async buildControllers(): Promise<[string]> {
    let out = await this.allInOneBuild.controllers.build(this.names.out.controllers, basename(this.names.out.controllers, '.js'));
    return [out];
  }

  protected mkServer(app: express.Application): ReloadOrError & HasServer {
    return new DefaultAppServer(app);
  }

  protected serverMarkup(): string {
    return this.templates.withSock({
      sockPath: DefaultAppServer.SOCK_PREFIX,
      js: _.concat(this.support.externals.js || [], [this.names.out.completeItemTag.path]),
      markup: this.names.out.completeItemTag.tag
    });
  }

  protected fileMarkup(): string {
    return this.templates.basic({
      js: _.concat(this.support.externals.js || [], [this.names.out.completeItemTag.path]),
      markup: this.names.out.completeItemTag.tag
    });
  };

  protected get buildAssets() {
    return _.concat(super.buildAssets, [this.allInOneBuild.client.entryJsPath])
  }

  protected get generatedAssets() {
    return _.concat(super.generatedAssets,
      [this.names.out.viewElements,
      this.names.out.controllers]);
  }
}