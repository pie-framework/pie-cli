export function model(model) {
  return Promise.resolve({ value: 'server says: ' + model.prompt });
}