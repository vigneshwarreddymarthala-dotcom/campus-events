export const STUDY_PROGRAMS = [
  "Electrical Engineering",
  "Computer Science",
  "Mechanical Engineering",
  "Business Law",
  "Business Economics",
];

export const STUDENT_STATUSES = [
  "Austauschstudent - Exchange student",
  "Bachelorstudent - Bachelor's student",
  "Masterstudent - Master's student",
  "Double Degree Student",
];

export const GERMAN_LEVELS = [
  "Anfänger – Beginner",
  "Mittleres Niveau – Intermediate",
  "Fortgeschritten - Advanced",
];

export const STUDY_QUESTION = "Was studierst du? / What is your current degree programme?";
export const STUDY_OTHER_LABEL = "Sonstiges – bitte angeben: / Other – please specify:";
export const isPresetProgram = (v: string) => STUDY_PROGRAMS.includes(v);
