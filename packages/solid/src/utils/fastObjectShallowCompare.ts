// https://github.com/mui/mui-x/blob/master/packages/x-internals/src/fastObjectShallowCompare/fastObjectShallowCompare.ts
const is = Object.is;

export function fastObjectShallowCompare<T extends Record<string, any> | null>(a: T, b: T) {
  if (a === b) {
    return true;
  }
  if (!(a instanceof Object) || !(b instanceof Object)) {
    return false;
  }

  let aLength = 0;
  let bLength = 0;

  for (const key in a) {
    aLength += 1;

    if (!is(a[key], b[key])) {
      return false;
    }
    if (!(key in b)) {
      return false;
    }
  }

  for (const _ in b) {
    bLength += 1;
  }
  return aLength === bLength;
}
