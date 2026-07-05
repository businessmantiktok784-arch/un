// Static reference data. Universities/documents/opportunities/testimonials now
// live in Supabase — use `useUniversities`, `useDocuments`, etc. from
// `@/hooks/useLiveData` instead. Only enumerations stay here because they
// match the database enum types.
export const documentTypes = ["Exam", "CAT", "Assignment", "Notes", "Lab Report", "Project"] as const;

export const faculties = [
  "Engineering", "Science", "Medicine", "Business", "Law", "Education", "Agriculture", "Arts & Humanities", "ICT",
];
