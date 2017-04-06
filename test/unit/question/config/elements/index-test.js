import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { path as p } from '../../../../../lib/string-utils';

describe('elements', () => {

  let elements, fsExtra, isFileStat, isDirStat, mkStat;

  beforeEach(() => {

    mkStat = (f, d) => {
      return {
        isFile: () => f,
        isDirectory: () => d
      }
    }

    isFileStat = mkStat(true, false);
    isDirStat = mkStat(false, true);

    fsExtra = {
      statSync: stub().returns(mkStat(true, false))
    }

    elements = proxyquire('../../../../../lib/question/config/elements', {
      'fs-extra': fsExtra
    });
  });

  describe('LocalFile', () => {
    describe('build', () => {
      it('builds if localfile exists', () => {
        fsExtra.statSync.returns(isFileStat);
        let lf = elements.LocalFile.build('key', 'local-file.js');
        expect(lf).not.to.be.undefined;
      });

      it('does not build if localfile doesnt exist', () => {
        fsExtra.statSync.returns(mkStat(false, false));
        let lf = elements.LocalFile.build('key', 'local-file.js');
        expect(lf).to.be.undefined;
      });
    });
  });

  describe('LocalPacakge', () => {

    describe('build', () => {
      it('builds if path is to local dir w/ package.json', () => {
        fsExtra.statSync.returns(mkStat(true, true));
        let p = elements.LocalPackage.build('key', 'local-pkg');
        expect(p).not.to.be.undefined;
      });

      it('does not build if dir does not exist', () => {
        fsExtra.statSync.returns(mkStat(true, false));
        let p = elements.LocalPackage.build('key', 'local-pkg');
        expect(p).to.be.undefined;
      });

      it('does not build if dir does exist but package.json does not', () => {
        fsExtra.statSync
          .onFirstCall().returns(mkStat(false, true))
          .onSecondCall().returns(mkStat(false, false));
        let p = elements.LocalPackage.build('key', 'local-pkg');
        expect(p).to.be.undefined;
      });
    });
  });

  describe('PiePackage', () => {

    describe('build', () => {
      it('builds if path is to dir w/ controller dir', () => {
        fsExtra.statSync.returns(mkStat(true, true));
        let pp = elements.PiePackage.build('', 'key', 'local-pie');
        expect(pp).not.to.be.undefined;
      });

      it('does not build if the package.json is missing', () => {
        fsExtra.statSync
          .withArgs('local-pie/package.json').returns(mkStat(false, false))
          .returns(mkStat(true, true))

        let pp = elements.PiePackage.build('', 'key', 'local-pie');
        expect(pp).to.be.undefined;
      });

      it('does not build if the controller package.json is missing', () => {
        fsExtra.statSync
          .withArgs('local-pie/controller/package.json').returns(mkStat(false, false))
          .returns(mkStat(true, true))

        let pp = elements.PiePackage.build('', 'key', 'local-pie');
        expect(pp).to.be.undefined;
      });
    });

    describe('inNodeModulesDir', () => {
      it('returns false if value contains node_modules', () => {
        let pp = new elements.PiePackage('key', 'key');
        expect(pp.inNodeModulesDir).to.be.false;
      });

      it('returns true if value contains node_modules', () => {
        let pp = new elements.PiePackage('key', '../node_modules/key');
        expect(pp.inNodeModulesDir).to.be.true;
      });
    });

    describe('schemasDir', () => {
      it('returns schemas dir', () => {
        let pp = new elements.PiePackage('key', 'value');
        expect(pp.schemasDir).to.eql(p`value/docs/schemas`);
      });
    });

    describe('controllerDir', () => {
      it('returns controller dir', () => {
        let pp = new elements.PiePackage('key', 'value');
        expect(pp.controllerDir).to.eql(p`value/controller`);
      });
    });
  });
});