import * as _ from 'lodash';
import * as bundled from './elements/bundled';
import * as express from 'express';
import * as http from 'http';
import * as webpack from 'webpack';
import * as webpackMiddleware from 'webpack-dev-middleware';

import AllInOneBuild, { SupportConfig } from '../../question/build/all-in-one';
import { App, BuildOpts, ManifestOpts, ServeOpts } from '../types';
import { Declaration, ElementDeclaration, JsonConfig, Manifest } from '../../question/config';
import { Names, clientDependencies, getNames } from "../common";
import { archiveIgnores, archiver, createArchive } from '../create-archive';
import { buildLogger, getLogger } from 'log-factory';
import { join, resolve } from 'path';
import { remove, writeFileSync } from 'fs-extra';

const logger = buildLogger();
const builderLogger = getLogger('BUILD');

export function logBuild<T>(name: string, p: Promise<T>): Promise<T> {
  const start = new Date().getTime();
  builderLogger.info(`build ${name}`);
  return p.then((r) => {
    const duration = new Date().getTime() - start;
    builderLogger.info(`build ${name} complete - duration: ${duration} ms`);
    return r;
  });
}


export let build = (
  args: any,
  loadSupport: (JsonConfig) => Promise<SupportConfig>,
  mkApp: (JsonConfig, SupportConfig, Names) => App): Promise<App> => {
  const dir = resolve(args.dir || process.cwd());
  const config = new JsonConfig(dir);
  return loadSupport(config)
    .then((s: SupportConfig) => {
      const names = getNames(args);
      return mkApp(config, s, names);
    });
};

export type BuildStep = { label: string, fn: () => Promise<string[]> };


export abstract class BaseApp implements App {

  protected allInOneBuild: AllInOneBuild;
  protected branch: string;

  constructor(
    private args: any,
    readonly config: JsonConfig,
    protected support: SupportConfig,
    readonly names: Names) {
    this.branch = args.pieBranch || process.env.PIE_BRANCH || 'develop';

    this.allInOneBuild = new AllInOneBuild(
      config,
      support,
      this.names.build.entryFile,
      this.names.out.completeItemTag.path,
      this.args.writeWebpackConfig !== false);
  }

  /**
   * A set of build steps to be executed serially...
   */
  protected get buildSteps(): BuildStep[] {
    return [
      { label: this.names.out.completeItemTag.path, fn: this.buildAllInOne }
    ];
  }

  protected async buildAllInOne(): Promise<string[]> {
    let src = this.prepareWebpackJs();
    const out = await this.allInOneBuild.build(src);
    logger.info(`build: ${this.names.out.example}`);
    let example = this.buildExample();
    return [out.file, example];
  }

  async build(opts: BuildOpts): Promise<string[]> {

    await logBuild('install', this.install(opts.forceInstall));

    let files = await _.reduce(this.buildSteps, (acc, bs) => {
      return acc.then((f) => {
        return logBuild(bs.label, bs.fn.bind(this)()).then((bsf) => _.concat(f, bsf));
      });
    }, Promise.resolve([]));

    if (!opts.keepBuildAssets) {
      await logBuild('remove build assets...', this.removeBuildAssets());
    }

    return files;
  }

  protected writeBundledItem(): void {
    let bundledSrc = bundled.js(
      this.names.build.controllersMap,
      'pie-controller',
      this.config);
    writeFileSync(join(this.config.dir, this.names.build.bundledItem.path), bundledSrc, 'utf8');
  }

  protected get declarations(): Declaration[] {
    return _.concat([
      new ElementDeclaration('pie-player'),
      new ElementDeclaration('pie-control-panel'),
      //Note: we assign the bundled-item to the tag <pie-item>
      new ElementDeclaration(this.names.out.completeItemTag.name, this.names.build.bundledItem.path)
    ], this.config.declarations || []);
  }

  private prepareWebpackJs(): string {
    let controllerMapSrc = this.allInOneBuild.controllerMapSrc;
    writeFileSync(join(this.config.dir, this.names.build.controllersMap), controllerMapSrc, 'utf8');
    this.writeBundledItem();
    return this.allInOneBuild.js(this.declarations);
  }

  private buildExample(): string {
    let markup = this.fileMarkup();
    writeFileSync(join(this.config.dir, this.names.out.example), markup, 'utf8');
    return this.names.out.example;
  }

  /** Create markup rendering the app. */
  protected abstract fileMarkup(): string;

  protected async install(force: boolean): Promise<void> {
    await this.allInOneBuild.install({
      dependencies: clientDependencies(this.args),
      devDependencies: this.support.npmDependencies || {}
    }, force);
  }

  public async manifest(opts: ManifestOpts): Promise<Manifest> {
    /** 
     * TODO: we should be adding the App's extra dependencies
     * to give a true manifest of what's compiled.
     */
    if (opts.outfile) {
      writeFileSync(opts.outfile, this.config.manifest, 'utf8');
    }
    return this.config.manifest;
  }


  protected get buildAssets(): string[] {
    return [
      this.allInOneBuild.writtenWebpackConfig,
      this.names.build.bundledItem.path,
      this.names.build.controllersMap,
      this.names.build.entryFile,
      this.names.out.archive,
      'controllers',
      'node_modules',
      'package.json'
    ];
  }

  protected get generatedAssets(): string[] {
    return [
      this.names.out.archive,
      this.names.out.completeItemTag.path,
      this.names.out.example,
      this.names.out.viewElements,
      this.names.out.controllers];
  }

  private removeBuildAssets(): Promise<string[]> {
    return this.removeFiles(this.buildAssets);
  }

  clean(): Promise<any> {
    const files = _.concat(this.buildAssets, this.generatedAssets);
    return this.removeFiles(files);
  }

  private removeFiles(files: string[]): Promise<string[]> {
    const p = _.map(files, (f) => new Promise((resolve, reject) => {
      remove(join(this.config.dir, f), (err) => {
        if (err) {
          reject(err);
        } else {
          resolve(f);
        }
      });
    }));
    return Promise.all(p);
  }
};
