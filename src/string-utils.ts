export function stripMargin(template, ...expressions) {
  const result = template.reduce((accumulator, part, i) => {
    return accumulator + expressions[i - 1] + part;
  });
  const out = result.replace(/\r?(\n)\s*\|/g, '$1');
  return out;
}
