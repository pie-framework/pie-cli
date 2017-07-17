import * as _ from 'lodash';
import * as generators from './src-generators';
import * as pug from 'pug';

import { App, Buildable, DefaultOpts, MakeManifest, ManifestOpts } from '../types';
import { ElementDeclaration, buildWebpack, writeConfig } from '../../code-gen';
import Install, {
  PieBuildInfo,
  configureDeclarations,
  controllerTargets,
  toDeclarations
} from '../../install';
import { JsonConfig, Manifest } from '../../question/config';
import { join, resolve } from 'path';

import { SupportConfig } from '../../framework-support';
import { promise as report } from '../../cli/report';
import { webpackConfig } from '../common';
import { writeFileSync } from 'fs-extra';

const basicExample = join(__dirname, 'views/example.pug');

const ENCODING = { encoding: 'utf8' };

const writeFile = (name: string, contents: string) => writeFileSync(name, contents, ENCODING);

export default class DefaultApp
  implements Buildable<string[], DefaultOpts>,
  App,
  MakeManifest {

  public static generatedFiles: string[] = [
    'pie-item.js',
    'pie-view.js',
    'pie-configure.js',
    'pie-controllers.js',
    'example.html'
  ];

  public static build(args: any, loadSupport: (JsonConfig) => Promise<SupportConfig>): Promise<DefaultApp> {
    const dir = resolve(args.dir || args.d || process.cwd());
    const config = JsonConfig.build(dir, args);
    return loadSupport(config).then(s => new DefaultApp(config, s));
  }

  private static CONFIGURE_ENTRY = 'default.configure.entry.js';
  private static CONFIGURE_BUNDLE = 'pie-configure.js';
  private static CONFIGURE_WEBPACK_CONFIG = 'default.configure.webpack.config.js';

  private template: pug.compileTemplate;
  private installer: Install;

  constructor(readonly config: JsonConfig, private support: SupportConfig) {
    this.template = pug.compileFile(basicExample, { pretty: true });
    this.installer = new Install(config.dir, config.raw);
  }

  public buildOpts(args): DefaultOpts {
    return new DefaultOpts(args);
  }

  public async build(opts: DefaultOpts): Promise<string[]> {
    const forceInstall = opts ? opts.forceInstall : false;

    const buildInfo = await this.installer.install(forceInstall);
    const client = await report('building client', this.buildClient(buildInfo, opts.addPlayerAndControlPanel));
    const controllers = await report('building controllers', this.buildControllers(opts.pieName, buildInfo));
    const configure = await report('building configure', this.buildConfigure(buildInfo));
    const allInOne = opts.includeComplete ?
      await report('building all-in-one', this.buildAllInOne(opts.pieName, buildInfo)) : [];
    const example = opts.includeComplete ?
      await report('building example', this.buildExample()) : [];

    return _.concat(client, controllers, configure, allInOne, example);
  }

  public manifest(opts: ManifestOpts): Promise<Manifest> {
    return Promise.reject(new Error('todo'));
  }

  private async buildConfigure(buildInfo: PieBuildInfo[]): Promise<string[]> {

    const js = configureDeclarations(buildInfo).map(e => e.js).join('\n');

    writeFile(join(this.installer.dir, DefaultApp.CONFIGURE_ENTRY), js);

    const config = webpackConfig(this.installer,
      this.support,
      DefaultApp.CONFIGURE_ENTRY,
      DefaultApp.CONFIGURE_BUNDLE,
      this.config.dir);

    await buildWebpack(config, DefaultApp.CONFIGURE_WEBPACK_CONFIG);
    return [DefaultApp.CONFIGURE_BUNDLE];
  }

  private async buildClient(buildInfo: PieBuildInfo[], addPlayerAndControlPanel: boolean): Promise<string[]> {

    const js = generators.client(toDeclarations(buildInfo).concat(addPlayerAndControlPanel ? [
      new ElementDeclaration('pie-player'),
      new ElementDeclaration('pie-control-panel')
    ] : []));

    writeFile(join(this.installer.dir, 'client.entry.js'), js);
    const config = webpackConfig(this.installer, this.support, 'client.entry.js', 'pie-view.js', this.config.dir);

    writeConfig(join(this.installer.dirs.root, 'client.webpack.config.js'), config);
    await buildWebpack(config);
    return ['pie-view.js'];
  }

  private async buildControllers(pieName: string, buildInfo: PieBuildInfo[]): Promise<string[]> {

    const controllers = controllerTargets(buildInfo);

    const js = generators.controllers(controllers);
    writeFile(join(this.installer.dir, 'controllers.entry.js'), js);
    const config = webpackConfig(
      this.installer,
      this.support,
      'controllers.entry.js',
      'pie-controllers.js',
      this.config.dir);

    config.output.library = `pie-controller-${pieName}`;
    config.output.libraryTarget = 'umd';

    writeConfig(join(this.installer.dirs.root, 'controllers.webpack.config.js'), config);
    await buildWebpack(config);
    return ['pie-controllers.js'];
  }

  private async buildAllInOne(pieName: string, buildInfo: PieBuildInfo[]): Promise<string[]> {

    if (!pieName) {
      throw new Error('You must specify a `pieName` in the args when using `--includeComplete`');
    }

    const controllerMap = controllerTargets(buildInfo);

    const pieModels = this.config.models();

    const js = generators.allInOne(
      pieName,
      toDeclarations(buildInfo),
      controllerMap,
      this.config.markup,
      pieModels,
      this.config.weights,
      this.config.langs
    );

    writeFile(join(this.installer.dir, 'all-in-one.entry.js'), js);
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

    writeFile(join(this.config.dir, 'example.html'), out);

    return Promise.resolve(['example.html']);
  }
}
