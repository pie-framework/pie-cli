import * as http from 'http';

import CatalogApp from './catalog';
import DefaultApp from './default';
import InfoApp from './info';
import ItemApp from './item';
import { JsonConfig } from '../question/config';
import { Manifest } from '../question/config/manifest';

export { InfoApp, DefaultApp, CatalogApp, ItemApp }

export class BuildOpts {
  constructor(readonly clean: boolean = false,
    readonly keepBuildAssets: boolean = false,
    readonly createArchive: boolean = false,
    readonly forceInstall: boolean = false
  ) { }

  static build(args: any) {
    return new BuildOpts(
      args.clean,
      args.keepBuildAssets === true,
      args.createArchive === true,
      args.forceInstall === true);
  }
}

export class ServeOpts {
  constructor(
    readonly dir: string,
    readonly port: number,
    readonly forceInstall: boolean) { }

  static build(args) {
    args = args || {};
    return new ServeOpts(
      args.dir || process.cwd(),
      args.port || 4000,
      args.forceInstall === true)
  }
}

export class ManifestOpts {
  constructor(readonly dir = process.cwd(), readonly outfile?: string) { }

  static build(args) {
    return new ManifestOpts(args.dir, args.outfile);
  }
}

export type BuildResult = {
  success: boolean
}

export interface Archivable {
  createArchive(): Promise<string>
}

export interface Servable {
  server(opts: ServeOpts): Promise<{ server: http.Server, reload: (string) => void }>
  watchableFiles(): string[];
}

export interface Buildable {
  build(opts: BuildOpts): Promise<string[]>
  manifest(opts: ManifestOpts): Promise<Manifest>
}

export interface App {
  clean(): Promise<any>
  config: JsonConfig;
}

export function isBuildable(a: any): a is Buildable {
  let b = (a as Buildable);
  return b.build !== undefined && b.manifest !== undefined;
}

export function isArchivable(a: any): a is Archivable {
  return (a as Archivable).createArchive !== undefined;
}

export function isServable(a: any): a is Servable {
  return (a as Servable).server !== undefined;
}
