import * as _ from 'lodash';
import * as http from 'http';

import { JsonConfig, Manifest } from '../question/config';

import { Mappings } from '../install';

export interface App {
  config: JsonConfig;
}

export class BuildOpts {

  public static build(args: any) {
    return new BuildOpts(
      args.clean,
      args.keepBuildAssets === true,
      args.createArchive === true,
      args.forceInstall === true);
  }

  constructor(readonly clean: boolean = false,
    readonly keepBuildAssets: boolean = false,
    readonly createArchive: boolean = false,
    readonly forceInstall: boolean = false
  ) { }
}

export class ServeOpts {

  public static build(args) {
    args = args || {};
    return new ServeOpts(
      args.dir || process.cwd(),
      args.port || 4000,
      args.forceInstall === true);
  }

  constructor(
    readonly dir: string,
    readonly port: number,
    readonly forceInstall: boolean) { }

}

export class ManifestOpts {

  public static build(args) {
    return new ManifestOpts(args.dir, args.outfile);
  }

  constructor(readonly dir = process.cwd(), readonly outfile?: string) { }
}

export type BuildResult = {
  success: boolean
};

export interface Archivable<T> {
  createArchive(t: T): Promise<string>;
}

export type ServeResult = {

  server: http.Server,
  reload: (name: string) => void,
  mappings: Mappings,
  dirs: {
    root: string,
    controllers: string,
    configure: string
  }
};

export interface Servable {
  server(opts: ServeOpts): Promise<ServeResult>;
  watchableFiles(): string[];
}

export interface Buildable<T> {
  build(opts: BuildOpts): Promise<T>;
}

export interface MakeManifest {
  manifest(opts: ManifestOpts): Promise<Manifest>;
}

export function isManifestable(a: any): a is MakeManifest {
  return _.isFunction(a.manifest);
}

export function isBuildable<T>(a: any): a is Buildable<T> {
  return _.isFunction(a.build);
}

export function isArchivable<T>(a: any): a is Archivable<T> {
  return _.isFunction(a.createArchive);
}

export function isServable(a: any): a is Servable {
  return _.isFunction(a.server);
}
