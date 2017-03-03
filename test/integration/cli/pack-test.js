import { expect } from 'chai';
import { stub, match, assert, spy } from 'sinon';
import proxyquire from 'proxyquire';
import { join } from 'path';
import { spawnSync } from 'child_process';
import { existsSync, readdirSync } from 'fs-extra';

import { setUpTmpQuestionAndComponents } from '../integration-test-helper';

describe('pack', () => {

  let mod, pack, configuration, paths;

  configuration = require('../../../lib/cli/configuration').default;

  before(() => {
    mod = require('../../../lib/cli/pack');
    pack = mod.default;
    //Requires that test/integration/init is included in the test run
    paths = global.it.sample;
  });

  describe('-a catalog', () => {

    before(function () {
      this.timeout(60000);
      return pack.run({
        app: 'catalog',
        createArchive: true,
        dir: paths.component,
        configuration: configuration,
        keepBuildAssets: true
      });
    });

    it('creates an archive in the demo dir', () => {
      console.log('readdir:', readdirSync(paths.demo));
      let exists = existsSync(join(paths.demo, 'pie-item.tar.gz'));
      expect(exists).to.be.true;
    });

    it('contains all the files in the archive', () => {
      let tarList = spawnSync('tar', ['-zvtf', join(paths.demo, 'pie-item.tar.gz')], { encoding: 'utf8' });

      let names = tarList.stdout.split('\n').map(l => {
        let arr = l.trim().split(' ');
        return arr[arr.length - 1];
      }).filter(s => s !== '');

      expect(names.sort()).to.eql([
        'config.json',
        'index.html',
        'pie-catalog.bundle.js',
        'pie-pkg/README.md',
        'pie-pkg/package.json',
        'schemas/config.json']);
    });
  });

  describe('-a default', () => {

    before(function () {
      this.timeout(60000);

      console.log('configuration: ', configuration);

      return pack.run({
        app: 'default',
        dir: paths.demo,
        configuration: configuration,
        includeComplete: true,
        keepBuildAssets: true
      });
    });

    it('creates pie-view.js', () => {
      expect(existsSync(join(paths.demo, 'pie-view.js')));
    });

    it('creates pie-controller.js', () => {
      expect(existsSync(join(paths.demo, 'pie-controller.js')));
    });

    it('creates pie-item.js', () => {
      expect(existsSync(join(paths.demo, 'pie-item.js')));
    });
  });
});