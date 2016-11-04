import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('loaders', () => {

  let mod;

  beforeEach(() => {
    mod = proxyquire('../../../src/code-gen/loaders', {});
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


    });

    describe('query', () => {

      it('returns an empty query object', () => {
        expect(new mod.LoaderNames('a').query).to.eql({});
      });

      it('returns a query object', () => {
        expect(new mod.LoaderNames('a?foo=bar&baz=moo').query).to.eql({
          foo: 'bar',
          baz: 'moo'
        });
      });
    });
  });

  describe('Loader', () => {

    describe('merge', () => {
      it('throws an error if the loaders do not match', () => {

        let one = new mod.Loader()
      });
    });
  });

});