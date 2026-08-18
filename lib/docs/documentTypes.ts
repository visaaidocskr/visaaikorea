// Document-type identifiers shared between the admin actions that create
// generated_documents rows and the pages that render them.
//
// Kept in a plain module rather than alongside the server actions: a
// "use server" file may only export async functions, so a constant declared
// there breaks the build.

/** The issued visa itself, as uploaded by an admin once it's granted. */
export const APPROVED_VISA_DOC_TYPE = "Approved visa";
