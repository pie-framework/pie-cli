import _ from 'lodash';

export let clientDependencies = (branch) => {
  branch = branch || 'develop';

  let branchSpecific = {
    'pie-controller': `PieLabs/pie-controller#${branch}`,
    'pie-player': `PieLabs/pie-player#${branch}`,
    'pie-control-panel': `PieLabs/pie-control-panel#${branch}`
  }

  return _.extend({
    'babel-core': '^6.17.0',
    'babel-loader': '^6.2.5',
    'style-loader': '^0.13.1',
    'css-loader': '^0.25.0',
    'webpack': '2.1.0-beta.21'

  }, branchSpecific);
};

