import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import { join } from 'path';
import temp from 'temp';

describe('element installer', () => {

  let mod,
    paths,
    ElementInstaller,
    installer,
    installedElements;

  before(function () {

    this.timeout(30000);
    mod = require('../../../lib/install/element-installer');
    ElementInstaller = mod.default;

    paths = global.it.sample;
    installer = new ElementInstaller(join(paths.tmp, 'element-intaller-test'));

    return installer.install({
      'my-el': '../example-components/hello-world',
      'el-with-no-controller': '../example-components/no-controller',
      'el-with-configure': '../example-components/with-config-package',
      'corespring-choice': 'github:pieelements/corespring-choice#feature/default-colors',
      'my-nl': 'corespring-number-line@~0.4.0'
    }).then(els => {
      installedElements = els;
    }).catch(e => {
      console.error('e: ', e);
    });
  });

  describe('install', () => {

    let myEl, elWithNoController, elWithConfigure, csChoice, nl;

    beforeEach(() => {
      [myEl, elWithNoController, elWithConfigure, csChoice, nl] = installedElements;
    });

    it('returns npmInstall for corespring-choice', () => {
      const { from, resolved, installationType, dir, moduleId } = csChoice.npmInstall;
      expect(from).to.eql('pieelements/corespring-choice#feature/default-colors');
      expect(resolved).to.match(/git:.*/);
      expect(installationType).to.eql('new-installation');
      expect(dir).to.match(/.*/);
      expect(moduleId).to.eql('corespring-choice');
    });

    it('returns no npmInstall for el-with-configure', () => {
      expect(elWithConfigure.npmInstall.from).to.eql('../../example-components/with-config-package');
    });

    it('returns nl.npmInstall.from', () => {
      expect(nl.npmInstall.from).to.eql('corespring-number-line@>=0.4.0 <0.5.0');
    });

    it('returns nl.npmInstall.version', () => {
      expect(nl.npmInstall.version).to.eql('0.4.0');
    });

    it('returns nl.npmInstall.moduleId', () => {
      expect(nl.npmInstall.moduleId).to.eql('corespring-number-line');
    });

    it('returns nl.npmInstall.resolved', () => {
      expect(nl.npmInstall.resolved.indexOf('https://registry.npmjs.org')).to.eql(0);
    });

    it('handles already installed packages', () => {
      return installer.install({
        'my-el': '../example-components/hello-world'
      }).then(elements => {
        const [{ npmInstall }] = elements;
        expect(npmInstall.installationType).to.eql('existing-installation');
      })
    });
  });
});