import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import { join } from 'path';
import temp from 'temp';

//todo - seems like I need to set up a new temp for this test run amongst the others.

describe('install', () => {

  let mod,
    paths,
    Installer,
    installer,
    result;

  before(function () {

    this.timeout(30000);
    mod = require('../../../lib/install');
    Installer = mod.default;

    paths = global.it.sample;
    installer = new Installer(
      join(paths.tmp, 'intaller-test'),
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

    it('handles already installed packages', () => {
      const newInstaller = new Installer(join(paths.tmp, 'intaller-test'), {
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