import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import { join } from 'path';
import temp from 'temp';
import { ensureDirSync } from 'fs-extra';

describe('install', () => {

  let mod,
    paths,
    Installer,
    installer,
    result,
    testDir;

  before(function () {

    this.timeout(30000);
    mod = require('../../../lib/install');
    Installer = mod.default;

    paths = global.it.sample;
    testDir = join(paths.tmp, 'installer-test');

    ensureDirSync(testDir);

    installer = new Installer(
      testDir,
      {
        elements: {
          'my-el': '../example-components/hello-world',
          'with-configure': '../example-components/with-config-package',
          'el-with-no-controller': '../example-components/no-controller',
        }
      });

    return installer.install().then(els => {
      result = els;
    }).catch(e => {
      console.error('e: ', e);
    });
  });

  describe('install', () => {

    it('handles already installed packages', function () {
      this.timeout(30000);
      const newInstaller = new Installer(
        testDir, {
          elements: {
            'my-el': '../example-components/hello-world'
          }
        });

      return newInstaller.install()
        .then(() => {
          expect(true).to.be.true;
        });
    });
  });
});