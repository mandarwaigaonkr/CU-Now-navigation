// src/data/groups.ts
// Group ↔ Section mapping and helpers
// Default config — can be overridden by Firestore "appConfig/groups" document

export interface GroupConfig {
  [key: number]: {
    label: string;
    sections: string[];
  };
}

/**
 * Default group configuration.
 * Each group has a label and a list of section letters.
 * This is the fallback if Firestore config hasn't loaded yet.
 */
export const DEFAULT_GROUP_CONFIG: GroupConfig = {
  1: { label: 'Group 1', sections: ['A', 'B', 'C', 'D', 'E', 'F', 'P'] },
  2: { label: 'Group 2', sections: ['I', 'J', 'K', 'L', 'M'] },
  3: { label: 'Group 3', sections: ['N', 'O', 'G', 'H'] },
}

/**
 * Get all section letters from a group config, sorted alphabetically.
 */
export function getAllSections(groupConfig: GroupConfig = DEFAULT_GROUP_CONFIG): string[] {
  return Object.values(groupConfig)
    .flatMap(g => g.sections)
    .sort()
}

/**
 * Given a section letter, return the group number (1, 2, or 3).
 * Returns null if the section doesn't belong to any group.
 */
export function getGroupBySection(section?: string | null, groupConfig: GroupConfig = DEFAULT_GROUP_CONFIG): number | null {
  if (!section) return null
  const upper = section.toUpperCase()
  for (const [groupNum, config] of Object.entries(groupConfig)) {
    if (config.sections.includes(upper)) {
      return parseInt(groupNum, 10)
    }
  }
  return null
}

/**
 * Get the label for a group number (e.g. 1 → "Group 1").
 */
export function getGroupLabel(groupNumber?: number | string | null, groupConfig: GroupConfig = DEFAULT_GROUP_CONFIG): string {
  if (groupNumber === 'all' || !groupNumber) return 'All Groups'
  const num = typeof groupNumber === 'string' ? parseInt(groupNumber, 10) : groupNumber
  return groupConfig[num]?.label || `Group ${groupNumber}`
}

/**
 * Get sections string for display (e.g. "A, B, C, D, E, F, P")
 */
export function getGroupSectionsLabel(groupNumber?: number | string | null, groupConfig: GroupConfig = DEFAULT_GROUP_CONFIG): string {
  if (groupNumber === 'all' || !groupNumber) return 'All sections'
  const num = typeof groupNumber === 'string' ? parseInt(groupNumber, 10) : groupNumber
  const sections = groupConfig[num]?.sections
  return sections ? sections.join(', ') : ''
}

/**
 * Build target group options for admin dropdowns.
 */
export function getTargetGroupOptions(groupConfig: GroupConfig = DEFAULT_GROUP_CONFIG) {
  return [
    { label: 'All Groups', value: 'all' },
    ...Object.entries(groupConfig).map(([num, config]) => ({
      label: `${config.label} (${config.sections.join(', ')})`,
      value: parseInt(num, 10),
    })),
  ]
}

/**
 * Build section options for onboarding dropdown.
 */
export function getSectionOptions(groupConfig: GroupConfig = DEFAULT_GROUP_CONFIG) {
  return getAllSections(groupConfig).map(s => ({
    label: `Section ${s}`,
    value: s,
  }))
}
