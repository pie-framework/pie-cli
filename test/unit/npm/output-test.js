import { assert, match, spy, stub } from 'sinon';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

describe('parseJson', () => {

  let mod;

  beforeEach(() => {
    mod = require('../../../lib/npm/output');
  });

  it('removes pre-json gunk', () => {
    const result = mod.parseJson(' \\t abc\\n{"foo":"bar"}');
    expect(result).to.eql({ foo: 'bar' });
  });
});