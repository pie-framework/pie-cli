export function model(question){
  return {
    prompt: 'from the server: ' + question.prompt
  }
}