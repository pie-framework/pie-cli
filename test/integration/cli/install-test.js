import { assert, match, spy, stub } from 'sinon';
import { existsSync, readdirSync } from 'fs-extra';

import { expect } from 'chai';
import { join } from 'path';
import proxyquire from 'proxyquire';
import { setUpTmpQuestionAndComponents } from '../integration-test-helper';
import { spawnSync } from 'child_process';

describe('install', () => {

  let mod, install, paths, info;

  before(() => {
    mod = require('../../../lib/cli/install');
    install = mod.default;
    //Requires that test/integration/init is included in the test run
    paths = global.it.sample;
  });

  describe('install', () => {

    before(function () {
      this.timeout(60000);
      console.log('paths: ', paths);

      return install.run({
        dir: `${paths.tmp}/example-questions/install`
      }).then(i => info = i);
    });

    it('works', () => {
      expect(info).not.to.be.undefined;
    });
  });

});