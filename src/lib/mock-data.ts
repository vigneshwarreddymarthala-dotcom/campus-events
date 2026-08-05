export type Category =
  | "workshop"
  | "seminar"
  | "competition"
  | "cultural"
  | "sports"
  | "guest-lecture"
  | "hackathon"
  | "other";

export type Event = {
  id: string;
  title: string;
  category: Category;
  description: string;
  date: string; // ISO date string
  endDate?: string;
  time: string;
  venue: string;
  mapLink?: string;
  bannerImage: string;
  bannerLink?: string;
  ticketUrl?: string;
  gallery: string[];
  organizer: string;
  contactEmail: string;
  registrationDeadline: string;
  capacity: number;
  registrationFee: number; // 0 = free
  eligibility: string;
  tags: string[];
  attachments: { name: string; url: string }[];
  status: "upcoming" | "ongoing" | "cancelled" | "postponed" | "completed";
  views: number;
  registrations: number;
};

export type Registrant = {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  year: string;
  department: string;
  registeredAt: string;
  attended: boolean;
};

// Returns true if event date has passed (auto-determines past regardless of status field)
export function isEventPast(event: Event): boolean {
  const endDate = event.endDate ?? event.date;
  return new Date(endDate) < new Date(new Date().toDateString());
}

export const MOCK_EVENTS: Event[] = [
  // ── PAST EVENTS (before Aug 4, 2026) ──────────────────────────────────────
  {
    id: "e7",
    title: "Web Development Bootcamp",
    category: "workshop",
    description:
      "An intensive 2-day bootcamp covering HTML, CSS, JavaScript, React, and Node.js. Participants built and deployed a full-stack project by Day 2.",
    date: "2026-07-18",
    endDate: "2026-07-19",
    time: "09:00",
    venue: "CS Lab 1, Block C",
    bannerImage: "https://images.unsplash.com/photo-1593720219276-0b1eacd0aef4?w=800&auto=format",
    gallery: [],
    organizer: "Dr. Rajesh Kumar",
    contactEmail: "rajesh@college.edu",
    registrationDeadline: "2026-07-15",
    capacity: 50,
    registrationFee: 299,
    eligibility: "2nd year and above, CS/IT",
    tags: ["web", "bootcamp", "react", "nodejs"],
    attachments: [],
    status: "completed",
    views: 934,
    registrations: 50,
  },
  {
    id: "e8",
    title: "Photography & Visual Storytelling Workshop",
    category: "cultural",
    description:
      "A hands-on workshop teaching composition, lighting, and visual storytelling with smartphones and DSLRs. Included a photo walk around campus.",
    date: "2026-07-25",
    time: "11:00",
    venue: "Open Air Gallery, Block D",
    bannerImage: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&auto=format",
    gallery: [],
    organizer: "Arts & Media Club",
    contactEmail: "arts@college.edu",
    registrationDeadline: "2026-07-22",
    capacity: 40,
    registrationFee: 0,
    eligibility: "Open to all",
    tags: ["photography", "art", "creative"],
    attachments: [],
    status: "completed",
    views: 512,
    registrations: 38,
  },
  {
    id: "e9",
    title: "Inter-Dept Quiz Championship",
    category: "competition",
    description:
      "Annual quiz competition with rounds covering science, technology, current affairs, sports, and pop culture. Teams of 3 from each department competed for the rolling trophy.",
    date: "2026-07-30",
    time: "14:00",
    venue: "Seminar Hall 2, Block B",
    bannerImage: "https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800&auto=format",
    gallery: [],
    organizer: "Dr. Rajesh Kumar",
    contactEmail: "rajesh@college.edu",
    registrationDeadline: "2026-07-27",
    capacity: 120,
    registrationFee: 0,
    eligibility: "Open to all departments",
    tags: ["quiz", "competition", "team"],
    attachments: [{ name: "Result Sheet.pdf", url: "#" }],
    status: "completed",
    views: 723,
    registrations: 117,
  },
  {
    id: "e10",
    title: "Mental Health Awareness Seminar",
    category: "seminar",
    description:
      "A sensitisation seminar by a certified counsellor on recognising stress, anxiety, and burnout in college students. Included an open Q&A session and resource handouts.",
    date: "2026-08-01",
    time: "10:00",
    venue: "Conference Room, Admin Block",
    bannerImage: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=800&auto=format",
    gallery: [],
    organizer: "Student Welfare Cell",
    contactEmail: "welfare@college.edu",
    registrationDeadline: "2026-07-31",
    capacity: 200,
    registrationFee: 0,
    eligibility: "Open to all",
    tags: ["health", "wellness", "seminar"],
    attachments: [],
    status: "completed",
    views: 445,
    registrations: 178,
  },
  // ── UPCOMING EVENTS ────────────────────────────────────────────────────────
  {
    id: "e1",
    title: "National Hackathon 2026",
    category: "hackathon",
    description:
      "Join our 36-hour hackathon where teams of 2–4 compete to build innovative solutions. Themes include HealthTech, EdTech, and FinTech. Prizes worth ₹1,50,000 up for grabs. Meals and refreshments provided throughout.",
    date: "2026-08-15",
    endDate: "2026-08-16",
    time: "09:00",
    venue: "Main Auditorium, Block A",
    mapLink: "https://maps.google.com",
    bannerImage: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&auto=format",
    gallery: [],
    organizer: "Dr. Rajesh Kumar",
    contactEmail: "rajesh@college.edu",
    registrationDeadline: "2026-08-10",
    capacity: 200,
    registrationFee: 0,
    eligibility: "Open to all years",
    tags: ["hackathon", "coding", "prizes", "team"],
    attachments: [{ name: "Rulebook.pdf", url: "#" }],
    status: "upcoming",
    views: 1240,
    registrations: 143,
  },
  {
    id: "e2",
    title: "AI & ML Workshop",
    category: "workshop",
    description:
      "Hands-on workshop covering machine learning fundamentals, neural networks, and practical Python implementations. Bring your laptop. Prerequisites: Basic Python knowledge.",
    date: "2026-08-20",
    time: "10:00",
    venue: "CS Lab 3, Block C",
    bannerImage: "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&auto=format",
    gallery: [],
    organizer: "Prof. Anita Sharma",
    contactEmail: "anita@college.edu",
    registrationDeadline: "2026-08-18",
    capacity: 60,
    registrationFee: 199,
    eligibility: "3rd and 4th year, CS/IT departments",
    tags: ["AI", "ML", "Python", "hands-on"],
    attachments: [],
    status: "upcoming",
    views: 892,
    registrations: 54,
  },
  {
    id: "e3",
    title: "Industry Guest Lecture: Future of Web Development",
    category: "guest-lecture",
    description:
      "Mr. Arun Patel, CTO of TechCorp India, shares insights on modern web architectures, career paths, and what the industry expects from fresh graduates.",
    date: "2026-08-08",
    time: "14:00",
    venue: "Seminar Hall 1, Block B",
    bannerImage: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format",
    gallery: [],
    organizer: "Dr. Rajesh Kumar",
    contactEmail: "rajesh@college.edu",
    registrationDeadline: "2026-08-07",
    capacity: 300,
    registrationFee: 0,
    eligibility: "Open to all",
    tags: ["web", "career", "industry", "lecture"],
    attachments: [],
    status: "upcoming",
    views: 678,
    registrations: 189,
  },
  {
    id: "e4",
    title: "Inter-College Cricket Tournament",
    category: "sports",
    description:
      "Annual cricket tournament open to all departments. Team size: 11 + 4 substitutes. Register your team before the deadline.",
    date: "2026-08-22",
    endDate: "2026-08-24",
    time: "08:00",
    venue: "Sports Ground, East Campus",
    bannerImage: "https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&auto=format",
    gallery: [],
    organizer: "Sports Committee",
    contactEmail: "sports@college.edu",
    registrationDeadline: "2026-08-15",
    capacity: 120,
    registrationFee: 0,
    eligibility: "Open to all departments",
    tags: ["sports", "cricket", "team", "tournament"],
    attachments: [{ name: "Tournament Schedule.pdf", url: "#" }],
    status: "upcoming",
    views: 445,
    registrations: 96,
  },
  {
    id: "e5",
    title: "Entrepreneurship Seminar",
    category: "seminar",
    description:
      "A panel discussion featuring 5 alumni entrepreneurs sharing their startup journeys, funding experiences, and lessons learned.",
    date: "2026-09-02",
    time: "11:00",
    venue: "Conference Room, Admin Block",
    bannerImage: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&auto=format",
    gallery: [],
    organizer: "E-Cell, College",
    contactEmail: "ecell@college.edu",
    registrationDeadline: "2026-08-30",
    capacity: 100,
    registrationFee: 0,
    eligibility: "Open to all",
    tags: ["startup", "entrepreneurship", "alumni"],
    attachments: [],
    status: "upcoming",
    views: 312,
    registrations: 67,
  },
  {
    id: "e6",
    title: "Annual Cultural Fest — Rang 2026",
    category: "cultural",
    description:
      "Three days of music, dance, drama, art exhibitions, and food stalls. Participate in individual and group events. Celebrity performance on Day 3!",
    date: "2026-09-12",
    endDate: "2026-09-14",
    time: "09:00",
    venue: "Open Air Amphitheatre",
    bannerImage: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format",
    gallery: [],
    organizer: "Cultural Committee",
    contactEmail: "cultural@college.edu",
    registrationDeadline: "2026-09-05",
    capacity: 2000,
    registrationFee: 99,
    eligibility: "Open to all",
    tags: ["cultural", "music", "dance", "fest"],
    attachments: [{ name: "Events Brochure.pdf", url: "#" }],
    status: "upcoming",
    views: 2145,
    registrations: 876,
  },
];

export const MOCK_REGISTRANTS: Registrant[] = [
  { id: "r7", eventId: "e7", name: "Arjun Nair", email: "arjun@college.edu", phone: "9876543220", year: "2nd", department: "CS", registeredAt: "2026-07-10T09:00:00Z", attended: true },
  { id: "r8", eventId: "e7", name: "Divya Sharma", email: "divya@college.edu", phone: "9876543221", year: "3rd", department: "IT", registeredAt: "2026-07-11T10:00:00Z", attended: true },
  { id: "r9", eventId: "e8", name: "Vikram Rao", email: "vikram@college.edu", phone: "9876543222", year: "1st", department: "CS", registeredAt: "2026-07-18T11:00:00Z", attended: true },
  { id: "r10", eventId: "e9", name: "Pooja Iyer", email: "pooja@college.edu", phone: "9876543223", year: "4th", department: "ECE", registeredAt: "2026-07-20T12:00:00Z", attended: true },
  { id: "r11", eventId: "e10", name: "Siddharth Menon", email: "sid@college.edu", phone: "9876543224", year: "2nd", department: "Mechanical", registeredAt: "2026-07-25T13:00:00Z", attended: false },
  { id: "r1", eventId: "e1", name: "Priya Menon", email: "priya@college.edu", phone: "9876543210", year: "3rd", department: "CS", registeredAt: "2026-07-20T10:00:00Z", attended: false },
  { id: "r2", eventId: "e1", name: "Rahul Singh", email: "rahul@college.edu", phone: "9876543211", year: "2nd", department: "IT", registeredAt: "2026-07-21T11:00:00Z", attended: false },
  { id: "r3", eventId: "e1", name: "Sneha Patel", email: "sneha@college.edu", phone: "9876543212", year: "4th", department: "ECE", registeredAt: "2026-07-22T09:00:00Z", attended: false },
  { id: "r4", eventId: "e2", name: "Aditya Kumar", email: "aditya@college.edu", phone: "9876543213", year: "3rd", department: "CS", registeredAt: "2026-07-25T14:00:00Z", attended: false },
  { id: "r5", eventId: "e2", name: "Meera Nair", email: "meera@college.edu", phone: "9876543214", year: "4th", department: "IT", registeredAt: "2026-07-26T15:00:00Z", attended: false },
  { id: "r6", eventId: "e3", name: "Karthik Reddy", email: "karthik@college.edu", phone: "9876543215", year: "1st", department: "CS", registeredAt: "2026-07-28T12:00:00Z", attended: false },
];

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: "workshop", label: "Workshop" },
  { value: "seminar", label: "Seminar" },
  { value: "competition", label: "Competition" },
  { value: "cultural", label: "Cultural" },
  { value: "sports", label: "Sports" },
  { value: "guest-lecture", label: "Guest Lecture" },
  { value: "hackathon", label: "Hackathon" },
  { value: "other", label: "Other" },
];

export const CATEGORY_COLORS: Record<Category, string> = {
  workshop: "bg-blue-100 text-blue-700",
  seminar: "bg-purple-100 text-purple-700",
  competition: "bg-orange-100 text-orange-700",
  cultural: "bg-pink-100 text-pink-700",
  sports: "bg-green-100 text-green-700",
  "guest-lecture": "bg-yellow-100 text-yellow-700",
  hackathon: "bg-red-100 text-red-700",
  other: "bg-gray-100 text-gray-700",
};
