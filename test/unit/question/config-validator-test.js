import { expect } from 'chai';
import { buildLogger } from '../../../src/log-factory';

const logger = buildLogger();

describe('config-validator', () => {
  let validate = require('../../../src/question/config-validator').validate;


  let assertValid = (obj, expected) => {
    it(`returns ${expected} for an empty ${JSON.stringify(obj)}`, () => {
      let result = validate(obj);
      logger.debug('result: ', JSON.stringify(result));
      expect(result.valid).to.eql(expected);
    });
  }

  assertValid({}, false);
  assertValid({ pies: [] }, false);
  assertValid({ pies: [{ id: '1' }] }, false);
  assertValid({ pies: [{ pie: { name: 'name', version: 'version' } }] }, false);
  assertValid({ pies: [{ id: '1', pie: { name: 'name', version: 'version' } }] }, true);


});