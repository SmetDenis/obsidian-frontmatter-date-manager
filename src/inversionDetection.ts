export type InversionFixStrategy =
  | 'disabled'
  | 'created-to-updated'
  | 'updated-to-created'
  | 'max-all';

export interface DateSources {
  created: Date;
  updated: Date;
  mtime: Date;
  ctime: Date;
}

export interface FixResult {
  created: Date;
  updated: Date;
}

export function isInversion(
  created: Date,
  updated: Date,
  toleranceSec: number,
): boolean {
  const tolMs = Math.max(0, toleranceSec) * 1000;
  return created.getTime() - updated.getTime() > tolMs;
}

export function applyInversionFix(
  strategy: Exclude<InversionFixStrategy, 'disabled'>,
  sources: DateSources,
): FixResult {
  switch (strategy) {
    case 'created-to-updated':
      return {
        created: new Date(sources.updated.getTime()),
        updated: new Date(sources.updated.getTime()),
      };
    case 'updated-to-created':
      return {
        created: new Date(sources.created.getTime()),
        updated: new Date(sources.created.getTime()),
      };
    case 'max-all': {
      const maxMs = Math.max(
        sources.created.getTime(),
        sources.updated.getTime(),
        sources.mtime.getTime(),
        sources.ctime.getTime(),
      );
      return { created: new Date(maxMs), updated: new Date(maxMs) };
    }
  }
}
