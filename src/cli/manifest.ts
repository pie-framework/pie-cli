import CliCommand from './cli-command';

class ManifestCommand extends CliCommand {
  constructor() {
    super('manifest', 'get a hash of the pie names and versions');
  }

  public async run(args) {
    return Promise.reject(new Error('manifest has been disabled while its under review (6.2.0+)'));
  }
}

export default new ManifestCommand();
