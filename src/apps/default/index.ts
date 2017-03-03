import * as _ from 'lodash';
import * as express from 'express';
import * as pug from 'pug';
import * as webpackMiddleware from 'webpack-dev-middleware';

import { App, BuildOpts, BuildResult, ManifestOpts } from '../types';
import { BaseApp, build as buildApp, logBuild } from './base';
import { Declaration, ElementDeclaration, JsonConfig } from '../../question/config';
import { basename, join, resolve } from 'path';

import { Names } from "../common";
import { SupportConfig } from '../../framework-support';
import { buildLogger } from 'log-factory';
import { stripMargin } from '../../string-utils';

const logger = buildLogger();

const basicExample = join(__dirname, 'views/example.pug');

export default class DefaultApp extends BaseApp {

  static build(args: any, loadSupport: (JsonConfig) => Promise<SupportConfig>): Promise<DefaultApp> {
    return buildApp(
      args,
      loadSupport,
      (c: JsonConfig, s: SupportConfig, n: Names) => new DefaultApp(args, c, s, n))
  }

  private defaultOpts: { includeComplete: boolean };
  private template: pug.compileTemplate;

  constructor(args: any, config: JsonConfig, support: SupportConfig, names: Names) {
    super(args, config, support, names);
    this.template = pug.compileFile(basicExample, { pretty: true })

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

  protected fileMarkup(): string {
    return this.template({
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