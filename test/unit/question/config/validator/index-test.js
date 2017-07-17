import _ from 'lodash';
import { buildLogger } from 'log-factory';
import { expect } from 'chai';
import proxyquire from 'proxyquire';
import { stub } from 'sinon';

const logger = buildLogger();

describe('config-validator', () => {

  let fsExtra, mod;

  beforeEach(() => {

    fsExtra = {
      readJsonSync: stub().returns({}),
      existsSync: stub().returns(true)
    }

    mod = proxyquire('../../../../../lib/question/config/validator', {
      'fs-extra': fsExtra
    });

  });

  describe('validateConfig', () => {

    let assertValid = (obj, expected) => {
      it(`returns ${expected} for an empty ${JSON.stringify(obj)}`, () => {
        let result = mod.validateConfig(obj);
        logger.debug('result: ', JSON.stringify(result));
        expect(result.valid).to.eql(expected);
      });
    }

    assertValid({}, false);
    assertValid({ elements: [] }, false);
    assertValid({ elements: {} }, true);
    assertValid({ elements: {}, models: [] }, false);
    assertValid({ elements: {}, models: [{ id: '1' }] }, false);
    assertValid({ elements: {}, models: [{ id: '1', element: 'a' }] }, true);
    assertValid({ elements: {}, models: [{ id: '1', element: 'a' }], weights: [] }, true);
    assertValid({ elements: {}, models: [{ id: '1', element: 'a' }], weights: [{}] }, false);
    assertValid({ elements: {}, models: [{ id: '1', element: 'a' }], weights: [{ id: '1' }] }, false);
    assertValid({ elements: {}, models: [{ id: '1', element: 'a' }], weights: [{ id: '1', weight: '1' }] }, true);
    assertValid({ elements: {}, langs: [1], models: [{ id: '1', element: 'a' }] }, false);
    assertValid({ elements: {}, langs: ['en-US'], models: [{ id: '1', element: 'a' }] }, true);
  });

  xdescribe('validate w/ pie schemas for individual pies', () => {

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
      elements: {
        'my-pie': '1.0.0'
      },
      models: [
        {
          id: '1',
          element: 'my-pie',
          prompt: 'What is 1 + 1',
          answer: '2'
        },
        {
          id: '2',
          element: 'my-pie',
          answer: '3'
        }
      ]
    }

    correctData = _.cloneDeep(data);
    correctData.models[1].prompt = 'fixed prompt';

    let assertValid = (obj, expected, failingId) => {
      let result;

      describe(`with ${JSON.stringify(obj)}`, () => {
        beforeEach(() => {

          fsExtra.existsSync.returns(true);
          fsExtra.readJsonSync.returns(pieSchema);

          result = validate(obj, [{ key: 'my-pie', schemasDir: 'docs/schemas' }]);
          logger.debug(result);
        });

        it(`returns ${expected} for ${JSON.stringify(obj)}`, () => {
          console.log('result: ', result)
          expect(result.valid).to.eql(expected);
        });

        it(`failing id is ${failingId}`, () => {
          if (!result.valid) {
            expect(result.failingConfigValidations[0].id).to.eql(failingId);
          }
        });
      });
    }

    assertValid(data, false, '2');
    assertValid(correctData, true);
  });
});