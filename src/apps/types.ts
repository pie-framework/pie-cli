import { ReloadOrError } from './server/types';
import { JsonConfig } from '../question/config';
import { Manifest } from '../question/config/manifest';

import InfoApp from './info';
import DefaultApp from './default';

export { InfoApp, DefaultApp }

import * as http from 'http';

export class BuildOpts {
  constructor(readonly clean: boolean = false,
    readonly keepBuildAssets: boolean = false
  ) { }

  static build(args: any) {
    return new BuildOpts(
      args.clean,
      args.keepBuildAssets === true);
  }
}

export class ServeOpts {
  constructor(readonly dir, readonly clean, readonly port) { }

  static build(args) {
    args = args || {};
    return new ServeOpts(
      args.dir || process.cwd(),
      args.clean === 'true' || args.clean === true || false,
      args.port || 4000)
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


export interface App {
  build(opts: BuildOpts): Promise<string[]>
  manifest(opts: ManifestOpts): Promise<Manifest>
  server(opts: ServeOpts): Promise<{ server: http.Server, reload: (string) => void }>
  clean(): Promise<any>
  config: JsonConfig;
}
