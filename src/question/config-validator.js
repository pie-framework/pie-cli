import Ajv from 'ajv';

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

export function validate(config) {
  var valid = validateFn(config);
  return { valid: valid, errors: validateFn.errors || [] }
}