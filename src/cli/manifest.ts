import { buildLogger } from '../log-factory';
import CliCommand from './cli-command';
import { writeJsonSync } from 'fs-extra';
import { make as makeManifest } from '../question/manifest';

const logger = buildLogger();

class ManifestOpts {
  constructor(readonly dir = process.cwd(), readonly outfile?: string) { }

  static buildOpts(args) {
    return new ManifestOpts(args.dir, args.outfile);
  }
}

class ManifestCommand extends CliCommand {
  constructor() {
    super('manifest', 'get a hash of the pie names and versions');
  }

  run(args) {
    let opts = ManifestOpts.buildOpts(args);
    logger.info('[run] opts: ', opts);

    let manifest = makeManifest(opts.dir);

    if (opts.outfile) {
      writeJsonSync(opts.outfile, manifest);
    }
    return Promise.resolve(JSON.stringify(manifest));
  }
}

let cmd = new ManifestCommand();
export let match = cmd.match.bind(cmd);
export let usage = cmd.usage;
export let summary = cmd.summary;
export let run = cmd.run.bind(cmd);