import { assert, match, spy, stub } from 'sinon';
import { existsSync, readdirSync } from 'fs-extra';

import { expect } from 'chai';
import { join } from 'path';
import proxyquire from 'proxyquire';
import { setUpTmpQuestionAndComponents } from '../integration-test-helper';
import { spawnSync } from 'child_process';

describe('pack', () => {

  let mod, pack, paths;


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
        'pie-pkg/configure-map.json',
        'pie-pkg/externals.json',
        'pie-pkg/package.json',
        'schemas/config.json']);
    });
  });

  describe('-a default', () => {

    before(function () {
      this.timeout(60000);

      return pack.run({
        app: 'default',
        dir: paths.demo,
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