import { PropertySkip } from './propertyPath';
import { strings, format } from './i18n';

// The user-facing reason a property was left unwritten. Shared by the manual
// command's notice, the once-per-session automatic notice and the bulk tables;
// kept out of the entry module so the bulk modals do not import `main.ts` at
// runtime.
export function propertySkipMessage(skip: PropertySkip): string {
  switch (skip.reason) {
    case 'parent-not-group':
      return format(strings.notices.skippedParentNotGroup, {
        name: skip.name,
        parent: skip.parent ?? '',
      });
    case 'shared-group':
      return format(strings.notices.skippedSharedGroup, {
        name: skip.name,
        parent: skip.parent ?? '',
      });
    case 'holds-container':
      return format(strings.notices.skippedHoldsContainer, { name: skip.name });
    case 'invalid-name':
      return format(strings.notices.skippedInvalidName, { name: skip.name });
  }
}
