export function stripMargin(template, ...expressions) {
  let result = template.reduce((accumulator, part, i) => {
    return accumulator + expressions[i - 1] + part;
  })
  let out = result.replace(/\r?(\n)\s*\|/g, '$1');
  return out;
}
