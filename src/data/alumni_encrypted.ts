/** AlumniRecord type kept for backward compatibility during migration.
 *  All data now served via /api/alumni/search and /api/alumni/verify.
 */
export type AlumniRecord = {
  name: string;
  className: string;
  fixedID: string;
  message: string;
  university: string;
  major: string;
  city: string;
};

/** DEPRECATED — returns empty array. Use /api/alumni/search instead. */
export function decodeAlumniList(): AlumniRecord[] {
  return [];
}
