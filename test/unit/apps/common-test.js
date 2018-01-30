import { assert, match, spy, stub } from 'sinon';
import { join, resolve } from 'path';

import { expect } from 'chai';
import { path as p } from '../../../lib/string-utils';
import proxyquire from 'proxyquire';

describe('common', () => {

  let mod, deps, installer, support, dirs;

  beforeEach(() => {
    deps = {
      path: {
        resolve: spy(function (p) {
          return p;
        })
      },
      'webpack': stub(),
      '../question/build/base-config': {
        default: stub().returns({
          module: {
            rules: [{ test: 'base' }]
          }
        })
      }
    }

    dirs = {
      root: 'root',
      configure: 'configure',
      controllers: 'controllers'
    }

    installer = {
    }

    support = {
      rules: [],
      extensions: ['.support-extension']
    }

    mod = proxyquire('../../../lib/apps/common', deps);
  });

  describe('webpackConfig', () => {
    let config;

    beforeEach(() => {
      config = mod.webpackConfig(dirs, support, 'entry.js', 'bundle.js');
    });

    it('adds the modules rules', () => {
      expect(config.module.rules).to.eql([{ test: 'base' }]);
    });

    it('adds resolve.modules', () => {
      expect(config.resolve.modules).to.eql([
        p`configure/node_modules`,
        p`controllers/node_modules`,
        p`root/node_modules`,
        p`node_modules`,
        resolve(join(__dirname, '../../../node_modules'))
      ]);
    });

    it('adds resolveLoader.modules', () => {
      expect(config.resolveLoader.modules).to.eql([
        p`root/node_modules`,
        p`node_modules`,
        resolve(join(__dirname, '../../../node_modules'))
      ]);
    });

    it('adds extensions', () => {
      expect(config.resolve.extensions).to.eql([
        '.js',
        '.support-extension'
      ]);
    });

    it('adds devtool: eval if sourceMaps is true', () => {
      let config = mod.webpackConfig(dirs, support, 'entry.js', 'bundle.js', null, true);
      expect(config.devtool).to.eql('eval');
    });

    it('does not add devtool: eval if sourceMaps is false', () => {
      let config = mod.webpackConfig(dirs, support, 'entry.js', 'bundle.js', null, false);
      expect(config.devtool).to.be.undefined;
    });
  });
});