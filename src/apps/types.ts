/* tslint:disable:member-access */

import * as _ from 'lodash';
import * as http from 'http';

import { JsonConfig, Manifest } from '../question/config';

import { PieBuildInfo } from '../install';

export interface App {
  config: JsonConfig;
}

export class BuildOpts {

  public static build(args: any) {
    return new BuildOpts(args);
  }

  readonly clean: boolean;
  readonly keepBuildAssets: boolean;
  readonly createArchive: boolean;
  readonly forceInstall: boolean;
  /** For legacy reasons allow a user to build a view with the player and control panel bundled. */
  readonly addPlayerAndControlPanel: boolean;

  constructor(args: any) {
    this.clean = args.clean === true;
    this.keepBuildAssets = args.keepBuildAssets === true;
    this.createArchive = args.createArchive === true;
    this.forceInstall = args.forceInstall === true;
    this.addPlayerAndControlPanel = args.addPlayerAndControlPanel === true;
  }
}

export class DefaultOpts extends BuildOpts {
  readonly includeComplete: boolean;
  readonly pieName: string;

  constructor(args: any) {
    super(args);
    this.includeComplete = args.includeComplete === true;
    this.pieName = args.pieName || 'pie-item';
  }
}

export class ServeOpts {

  public static build(args) {
    args = args || {};
    return new ServeOpts(
      args.dir || process.cwd(),
      args.port || 4000,
      args.forceInstall === true,
      args.clean === true,
      args.sourceMaps !== false);
  }

  constructor(
    readonly dir: string,
    readonly port: number,
    readonly forceInstall: boolean,
    readonly clean: boolean,
    readonly sourceMaps: boolean) { }

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
  buildInfo: PieBuildInfo[],
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

export interface Buildable<T, BO extends BuildOpts> {
  build(opts: BO): Promise<T>;
  buildOpts(args: any): BO;
}

export interface MakeManifest {
  manifest(opts: ManifestOpts): Promise<Manifest>;
}

export function isManifestable(a: any): a is MakeManifest {
  return _.isFunction(a.manifest);
}

export function isBuildable<T, BO>(a: any): a is Buildable<T, BO> {
  return _.isFunction(a.build);
}

export function isArchivable<T>(a: any): a is Archivable<T> {
  return _.isFunction(a.createArchive);
}

export function isServable(a: any): a is Servable {
  return _.isFunction(a.server);
}
