export function model(question){
  return Promise.resolve({
    prompt: 'from the server: ' + question.prompt
  });
}