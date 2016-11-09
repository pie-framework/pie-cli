import { expect } from 'chai';
import { buildLogger } from '../../../src/log-factory';
import _ from 'lodash';

const logger = buildLogger();

describe('config-validator', () => {
  let validate = require('../../../src/question/config-validator').validate;

  describe('validate', () => {

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

  describe('validate w/ pie schemas for individual pies', () => {

    let data, pieSchema, correctData;


    pieSchema = {
      title: 'test pie schema',
      type: 'object',
      properties: {
        prompt: {
          type: 'string'
        },
        answer: {
          type: 'string'
        }
      },
      required: ['prompt', 'answer']
    }

    data = {
      pies: [
        {
          id: '1',
          pie: { name: 'my-pie', version: '1.0.0' },
          prompt: 'What is 1 + 1',
          answer: '2'
        },
        {
          id: '2',
          pie: { name: 'my-pie', version: '1.0.0' },
          answer: '3'
        }
      ]
    }

    correctData = _.cloneDeep(data);
    correctData.pies[1].prompt = 'fixed prompt';

    let assertValid = (obj, expected, failingId) => {
      let result;

      describe(`with ${JSON.stringify(obj)}`, () => {
        beforeEach(() => {
          result = validate(obj, () => pieSchema);
          logger.debug(result);
        });

        it(`returns ${expected} for ${JSON.stringify(obj)}`, () => {
          expect(result.valid).to.eql(expected);
        });

        it(`failing id is ${failingId}`, () => {
          if (!result.valid) {
            expect(result.failingPieValidations[0].id).to.eql(failingId);
          }
        });
      });
    }

    assertValid(data, false, '2');
    assertValid(correctData, true);
  });
});