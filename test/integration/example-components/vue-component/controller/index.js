import _ from 'lodash';

export function model(question) {

  let mapped = _.map(['from', 'the', 'server'], (n) => n);

  return Promise.resolve({
    prompt: mapped.join(', ') + ':' + question.prompt
  });
}