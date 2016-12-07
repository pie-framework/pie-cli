import { expect } from 'chai';

describe('filter-ls', () => {

  let filter, data;

  beforeEach(() => {
    filter = require('../../../lib/npm/filter-ls').filterFirstLevelDependencies

    data = {
      name: 'mock ls output',
      dependencies: {
        a: {
          dependencies: {
            'a.a': {},
            'a.b': {}
          }
        },
        c: {}
      }
    }
  });

  it('filters one dependency', () => {
    let result = filter(data, ['a']);

    expect(result).to.eql({
      a: {
        'a.a': {},
        'a.b': {}
      }
    });
  });

  it('returns an empty object if key is not missing but is missing dependencies', () => {
    let result = filter(data, ['c']); 
    expect(result).to.eql({c: {}});
  });

  it('throws an error if a key is missing', () => {
    expect(() => filter(data, ['b'])).to.throw(Error);
  });
});