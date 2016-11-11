import { join } from 'path';

/**
 * Temporarily define support for corespring-legacy pies
 * Until we have set up support for defining build support in
 * a pie's package.json. 
 * @see https://github.com/PieLabs/pie-cli/issues/47
 */
export default [
  join(__dirname, '../framework-support/frameworks/corespring-legacy')
];