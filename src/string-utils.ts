const merge = (template, expressions) => {
  return template.reduce((accumulator, part, i) => {
    const e = expressions[i - 1];
    return accumulator + e + part;
  });
}

export function stripMargin(template, ...expressions) {
  const result = merge(template, expressions);
  const out = result.replace(/\r?(\n)\s*\|/g, '$1');
  return out;
}

/**
 * Template literal function.
 * Return a platform compliant path: 
 * 
 * Eg: `path\`this/is/the/path\``
 * returns 'this/is/the/path' on linux/mac
 * returns 'this\is\the\path' on windows
 */
export function path(template, ...expressions) {
  const result = merge(template, expressions);
  const isWin = /^win/.test(process.platform);
  return isWin ? result.replace(/\//g, '\\') : result;
}
