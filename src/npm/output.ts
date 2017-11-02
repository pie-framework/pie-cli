/**
 * if the stdout doesnt start with '{', rm the gunk before the json starts.
 * @param stdout
 */
export function parseJson(stdout: string): any {

  const trimmed = stdout.trim();
  const openBraceIndex = trimmed.indexOf('{');
  if (openBraceIndex === 0) {
    return JSON.parse(stdout);
  } else {
    const gunkRemoved = trimmed.substring(openBraceIndex);
    return JSON.parse(gunkRemoved);
  }
}
