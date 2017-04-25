import * as _ from 'lodash';
import * as generators from './src-generators';
import * as pug from 'pug';

import { App, BuildOpts, Buildable, MakeManifest, ManifestOpts } from '../types';
import { ElementDeclaration, buildWebpack, writeConfig } from '../../code-gen';
import Install, { PieTarget } from '../../install';
import { JsonConfig, Manifest } from '../../question/config';
import { join, resolve } from 'path';

import { SupportConfig } from '../../framework-support';
import { promise as report } from '../../cli/report';
import { webpackConfig } from '../common';
import { writeFileSync } from 'fs-extra';

const basicExample = join(__dirname, 'views/example.pug');

export default class DefaultApp implements Buildable<string[]>, App, MakeManifest {

  public static generatedFiles: string[] = [
    'pie-item.js',
    'pie-view.js',
    'pie-controllers.js',
    'example.html'
  ];

  public static build(args: any, loadSupport: (JsonConfig) => Promise<SupportConfig>): Promise<DefaultApp> {
    const dir = resolve(args.dir || args.d || process.cwd());
    const config = JsonConfig.build(dir, args);
    return loadSupport(config).then(s => new DefaultApp(args, config, s));
  }

  private defaultOpts: { includeComplete: boolean };
  private template: pug.compileTemplate;
  private installer: Install;

  constructor(args: any, readonly config: JsonConfig, private support: SupportConfig) {
    this.template = pug.compileFile(basicExample, { pretty: true });

    this.defaultOpts = {
      includeComplete: args.c || args.includeComplete || false
    };

    this.installer = new Install(config);
  }

  public async build(opts: BuildOpts): Promise<string[]> {
    const forceInstall = opts ? opts.forceInstall : false;

    const mappings = await this.installer.install(forceInstall);
    const client = await report('building client', this.buildClient(opts.addPlayerAndControlPanel));
    const controllers = await report('building controllers', this.buildControllers(mappings.controllers));
    const { includeComplete } = this.defaultOpts;
    const allInOne = includeComplete ?
      await report('building all-in-one', this.buildAllInOne(mappings.controllers)) : [];
    const example = includeComplete ? await report('building example', this.buildExample()) : [];

    return _.concat(client, controllers, allInOne, example);
  }

  public manifest(opts: ManifestOpts): Promise<Manifest> {
    return Promise.resolve(this.config.manifest);
  }

  private async buildClient(addPlayerAndControlPanel: boolean): Promise<string[]> {

    const js = generators.client(this.config.declarations.concat(addPlayerAndControlPanel ? [
      new ElementDeclaration('pie-player'),
      new ElementDeclaration('pie-control-panel')
    ] : []));

    writeFileSync(join(this.installer.dir, 'client.entry.js'), js, 'utf8');
    const config = webpackConfig(this.installer, this.support, 'client.entry.js', 'pie-view.js', this.config.dir);

    writeConfig(join(this.installer.dirs.root, 'client.webpack.config.js'), config);
    await buildWebpack(config);
    return ['pie-view.js'];
  }

  private async buildControllers(controllers: PieTarget[]): Promise<string[]> {
    const js = generators.controllers(controllers);
    writeFileSync(join(this.installer.dir, 'controllers.entry.js'), js, 'utf8');
    const config = webpackConfig(
      this.installer,
      this.support,
      'controllers.entry.js',
      'pie-controllers.js',
      this.config.dir);

    config.output.library = 'pie-controllers';
    config.output.libraryTarget = 'umd';

    writeConfig(join(this.installer.dirs.root, 'controllers.webpack.config.js'), config);
    await buildWebpack(config);
    return ['pie-controllers.js'];
  }

  private async buildAllInOne(controllerMap: PieTarget[]): Promise<string[]> {

    const pieModels = this.config.pieModels(this.installer.installedPies);
    const elementModels = this.config.elementModels(this.installer.installedPies);
    const js = generators.allInOne(
      this.config.declarations,
      controllerMap,
      this.config.markup,
      pieModels,
      elementModels,
      this.config.weights,
      this.config.langs
    );

    writeFileSync(join(this.installer.dir, 'all-in-one.entry.js'), js, 'utf8');
    const config = webpackConfig(
      this.installer,
      this.support,
      'all-in-one.entry.js',
      'pie-item.js',
      this.config.dir);

    writeConfig(join(this.installer.dirs.root, 'all-in-one.webpack.config.js'), config);
    await buildWebpack(config);
    return ['pie-item.js'];
  }

  private buildExample(): Promise<string[]> {
    const out: string = this.template({
      js: ['./pie-item.js'],
      markup: '<pie-item></pie-item>'
    });

    writeFileSync(join(this.config.dir, 'example.html'), out, 'utf8');
    return Promise.resolve(['example.html']);
  }
};
