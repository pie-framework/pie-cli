import { expect } from 'chai';
import { buildLogger } from '../../../src/log-factory';
const logger = buildLogger();

describe('duplicate-loaders', () => {

  let DuplicateLoaders, config;

  beforeEach(() => {
    config = {
      module: {
        loaders: [
          { loader: 'a!b' },
          { loader: 'a!b' }
        ]
      }
    }

    DuplicateLoaders = require('../../../src/code-gen/duplicate-loaders').default;
  });

  describe('fromConfig', () => {

    it('returns duplicates w/ present=false for undefined config', () => {
      expect(DuplicateLoaders.fromConfig().present).to.eql(false);
    });

    it('returns duplicates w/ present=false for empty config.module', () => {
      expect(DuplicateLoaders.fromConfig({}).present).to.eql(false);
    });

    it('returns duplicates w/ present=false for an empty config.module.loaders', () => {
      expect(DuplicateLoaders.fromConfig({ module: {} }).present).to.eql(false);
    });

    it('returns duplicates w/ present=true for a config', () => {
      let duplicates = DuplicateLoaders.fromConfig(config);
      logger.debug('duplicates: ', duplicates);
      expect(duplicates.present).to.eql(true);
    });
  });

  describe('present', () => {
    it('returns false for an new instance', () => {
      expect(new DuplicateLoaders().present).to.eql(false);
    });

    it('returns true an instance with a duplicate added', () => {
      let duplicates = new DuplicateLoaders();
      duplicates.add('a', [{ loader: 'a' }, { loader: 'a-loader' }]);
      expect(duplicates.present).to.eql(true);
    });
  });

  describe('error', () => {
    it('returns an error', () => {
      let duplicates = new DuplicateLoaders();
      duplicates.add('a', [{ loader: 'a' }, { loader: 'a-loader' }]);
      expect(duplicates.error.message).to.eql('The following loaders are duplicated: a');
    });
  });
});