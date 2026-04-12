declare module 'picomatch/posix' {
  interface PicomatchOptions {
    dot?: boolean;
    matchBase?: boolean;
    nocase?: boolean;
  }
  function isMatch(
    str: string,
    pattern: string | string[],
    options?: PicomatchOptions,
  ): boolean;
  function makeRe(glob: string, options?: PicomatchOptions): RegExp;
  export { isMatch, makeRe };
}
