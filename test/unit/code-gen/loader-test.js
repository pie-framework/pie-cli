import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('loaders', () => {

  let mod;

  beforeEach(() => {
    mod = proxyquire('../../../lib/code-gen/loaders', {});
  });

  describe('LoaderName', () => {

    describe('normalized', () => {
      it('normalizes the short name', () => {
        expect(new mod.LoaderName('a').normalized).to.eql('a-loader');
      });

      it('normalizes the resolved name', () => {
        expect(new mod.LoaderName('path/to/a.js').normalized).to.eql('a-loader');
      });
      it('does not normalize the normalized name', () => {
        expect(new mod.LoaderName('a-loader').normalized).to.eql('a-loader');
      });
    });
  });

  describe('LoaderNames', () => {


    describe('normalized', () => {
      it('returns 1 names', () => {
        expect(new mod.LoaderNames('a').normalized).to.eql('a-loader');
      });

      it('returns 2 names', () => {
        expect(new mod.LoaderNames('a!b').normalized).to.eql('a-loader!b-loader');
      });

      it('splits 1 loader with 1 query', () => {
        let name = 'exports?JXG';
        let names = new mod.LoaderNames(name);
        expect(names.normalized).to.eql('exports-loader');
      });

      describe('2 loaders with 2 queries', () => {
        let names;
        beforeEach(() => {
          let name = 'a?blah!exports?JXG';
          names = new mod.LoaderNames(name);
        });

        it('extracts the 1st query', () => {
          expect(names._names[0].query).to.eql('blah');
        });

        it('extracts the 2nd query', () => {
          expect(names._names[1].query).to.eql('JXG');
        });

        it('splits 2 loaders with 2 queries', () => {
          expect(names.normalized).to.eql('a-loader!exports-loader');
        });

      });
    });
  });

  describe('Loader', () => {

    describe('normalizedName', () => {

      it('returns the name', () => {
        expect(new mod.Loader({ loader: 'a!b!c' }).normalizedName).to.eql('a-loader!b-loader!c-loader')
      });
    });
  });

});