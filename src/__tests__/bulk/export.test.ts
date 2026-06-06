import { describe, it, expect } from 'vitest';
import { toTSV } from '../../bulk/export';

describe('toTSV', () => {
  it('serializes the header and rows tab/newline separated', () => {
    expect(
      toTSV(
        ['File', 'Created'],
        [
          ['a.md', '2024-01-01'],
          ['b.md', '2024-02-02'],
        ],
      ),
    ).toBe('File\tCreated\na.md\t2024-01-01\nb.md\t2024-02-02');
  });

  it('returns the header only when there are no rows', () => {
    expect(toTSV(['File', 'Created'], [])).toBe('File\tCreated');
  });

  it('flattens tabs and newlines inside cells to spaces', () => {
    expect(toTSV(['A'], [['x\ty'], ['p\nq'], ['r\r\ns']])).toBe(
      'A\nx y\np q\nr s',
    );
  });
});
