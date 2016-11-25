import * as Ajv from 'ajv';
import * as _ from 'lodash';
import { buildLogger } from '../log-factory';

const logger = buildLogger();

const schema = {
  title: 'config.json',
  description: 'The schema for a question config',
  type: 'object',
  properties: {
    pies: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string'
          },
          pie: {
            type: 'object',
            properties: {
              name: {
                type: 'string'
              },
              version: {
                type: 'string'
              }
            },
            required: [
              'name',
              'version'
            ]
          }
        },
        required: [
          'pie', 'id'
        ]
      }
    }
  },
  required: [
    'pies'
  ]
};

const ajv = new Ajv();

const validateFn = ajv.compile(schema);

interface EmptyValidate {
  (): boolean;
  errors: any[];
}

let emptyValidate: EmptyValidate = <EmptyValidate>function () {
  return true;
}

emptyValidate.errors = [];

function validatePie(loadSchema, obj) {
  logger.silly('[validatePie]', obj);
  let name = obj.pie.name;
  let schema = loadSchema(name);
  logger.silly('[validatePies] loadedSchema: ', schema);
  let validator = schema ? ajv.compile(schema) : emptyValidate;

  let valid = validator(obj);
  logger.silly(`validate: ${name}, errors: ${validator.errors}`);
  return {
    valid: valid,
    errors: validator.errors,
    id: obj.id
  }
}

type ValidationResult = {
  valid: boolean,
  errors: Ajv.ValidationError[],
  failingPieValidations?: any[]
}

/** 
 * TODO: For all pie libs referenced in the config
 * Try to find a schema for it and then validate that node against the schema
 */
export function validate(config, loadSchema): ValidationResult {

  loadSchema = loadSchema || (() => null);

  let baseValid = validateFn(config);

  if (baseValid) {
    let pieValidations = _.map(config.pies, validatePie.bind(null, loadSchema));
    let invalidPies = _.filter(pieValidations, (v: any) => !v.valid);
    let valid = baseValid && invalidPies.length === 0;

    logger.silly(`[validate] baseValid: ${baseValid}`);
    logger.silly(`[validate] invalidPies.length: ${invalidPies.length}`);

    return {
      valid: valid,
      errors: validateFn.errors || [],
      failingPieValidations: invalidPies
    }
  } else {
    logger.debug('[validate] baseValid = false');
    return {
      valid: false,
      errors: validateFn.errors
    }
  }
}