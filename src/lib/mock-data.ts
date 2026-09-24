export type Category = string;

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
  status: "upcoming" | "ongoing" | "cancelled" | "postponed" | "completed" | "scheduled";
  publishAt?: string;
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
  try {
    const dateStr = event.endDate ?? event.date;
    const timeStr = event.endDate ? "23:59" : (event.time ?? "23:59");
    
    // Extract HH:MM safely using regex
    const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
    const timeFormatted = match ? `${match[1].padStart(2, '0')}:${match[2]}` : "23:59";
    
    const eventDate = new Date(`${dateStr}T${timeFormatted}:00`);
    
    if (isNaN(eventDate.getTime())) {
      // Fallback: just parse the date string (YYYY-MM-DD)
      const justDate = new Date(dateStr);
      if (!isNaN(justDate.getTime())) {
        justDate.setHours(23, 59, 59);
        return justDate < new Date();
      }
      return false; // Extreme fallback
    }
    
    return eventDate < new Date();
  } catch (e) {
    return false;
  }
}

export function getEventStatus(event: Event): Event["status"] {
  if (event.status === "cancelled" || event.status === "postponed" || event.status === "scheduled") {
    return event.status;
  }
  
  if (isEventPast(event)) return "completed";
  
  let startDate = new Date();
  let endDate = new Date();
  
  try {
    const match = (event.time ?? "00:00").match(/^(\d{1,2}):(\d{2})/);
    const timeFormatted = match ? `${match[1].padStart(2, '0')}:${match[2]}` : "00:00";
    startDate = new Date(`${event.date}T${timeFormatted}:00`);
    
    if (isNaN(startDate.getTime())) startDate = new Date(event.date);
    
    if (event.endDate) {
      endDate = new Date(`${event.endDate}T23:59:00`);
      if (isNaN(endDate.getTime())) endDate = new Date(event.endDate);
    } else {
      endDate = new Date(`${event.date}T23:59:00`);
      if (isNaN(endDate.getTime())) endDate = new Date(event.date);
    }
  } catch (e) {
    // Fallback if completely invalid
  }
    
  const now = new Date();
  if (now >= startDate && now <= endDate) {
    return "ongoing";
  }
  
  return "upcoming";
}

export const MOCK_EVENTS: Event[] = [];

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
