import * as _ from 'lodash';
import * as webpack from 'webpack';

import { join, resolve } from 'path';

import { Dirs } from '@pie-cli-libs/installer';

import { SupportConfig } from '../framework-support/index';
import baseConfig from '../question/build/base-config';
import { buildLogger } from 'log-factory';
import { remove } from 'fs-extra';

const logger = buildLogger();

export type Compiler = webpack.compiler.Compiler;

export class Tag {
  constructor(readonly name: string, readonly path?: string) {
    this.path = this.path || `./${this.name}.js`;
  }

  get tag(): string {
    return `<${this.name}></${this.name}>`;
  }
}

export function removeFiles(dir, files: string[]): Promise<string[]> {
  const p: Promise<string>[] = _.map(
    files,
    f =>
      new Promise((res, reject) => {
        remove(join(dir, f), err => {
          if (err) {
            reject(err);
          } else {
            res(f);
          }
        });
      })
  );
  return Promise.all(p);
}

export function webpackConfig(
  dirs: Dirs,
  support: SupportConfig,
  entry: string,
  bundle: string,
  outpath?: string,
  sourceMaps: boolean = false
) {
  outpath = outpath || dirs.root;
  const modules = (d: string) => resolve(join(d, 'node_modules'));

  const base = baseConfig(dirs.root);

  logger.debug('support modules: ', support.modules);

  const coreModules = [
    'node_modules',
    resolve(join(__dirname, '../../node_modules'))
  ].concat(_.compact(support.modules));

  const resolveModules = [
    modules(dirs.configure),
    modules(dirs.controllers),
    modules(dirs.root)
  ].concat(coreModules);

  const resolveLoaderModules = [modules(dirs.root)].concat(coreModules);

  const out = _.extend(base, {
    context: dirs.root,
    entry: `./${entry}`,
    module: {
      rules: base.module.rules.concat(support.rules)
    },
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    },
    output: {
      // `chunkFilename` provides a template for naming code-split bundles (optional)
      chunkFilename: '[name].bundle.js',
      filename: bundle,
      path: outpath
    },
    resolve: {
      extensions: _.uniq(['.js'].concat(support.extensions)),
      modules: resolveModules
    },
    resolveLoader: {
      modules: resolveLoaderModules
    }
  });

  if (sourceMaps) {
    // out.devtool = 'eval';
  }

  return out;
}

export const clientDependencies = (args: any) =>
  args.configuration.app.dependencies;

export class Out {
  public static build(args) {
    return new Out(
      args.questionItemTagName ? new Tag(args.questionItemTagName) : undefined,
      args.questionElements,
      args.questionControllers,
      args.questionExample,
      args.questionArchive
    );
  }

  constructor(
    readonly completeItemTag: Tag = new Tag('pie-item'),
    readonly viewElements: string = 'pie-view.js',
    readonly controllers: string = 'pie-controller.js',
    readonly example: string = 'example.html',
    readonly archive: string = 'pie-item.tar.gz'
  ) {}
}

/**
 * @deprecated This should be removed
 */
export type Names = {
  build: BuildNames;
  out: Out;
};

type BuildNames = {
  entryFile: string;
  bundledItem: Tag;
  controllersMap: string;
};

export let getNames = (args: any): Names => {
  return {
    build: {
      bundledItem: new Tag('bundled-item', './.bundled-item.js'),
      controllersMap: './.controllers-map.js',
      entryFile: './.all-in-one.entry.js'
    },
    out: Out.build(args)
  };
};
