import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">CampusEvents</span>
        </div>

        <Link href="/register" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms &amp; Conditions</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: August 2026</p>

          {[
            {
              title: "1. Acceptance of Terms",
              body: "By creating an account on CampusEvents, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use the platform.",
            },
            {
              title: "2. Eligibility",
              body: "CampusEvents is available exclusively to students, faculty, and staff of the college. You must use your official college email address to register. Accounts registered with personal email addresses may be removed.",
            },
            {
              title: "3. Account Responsibilities",
              body: "You are responsible for maintaining the confidentiality of your account credentials. You must not share your account with others. Any activity under your account is your responsibility. Report unauthorized access immediately.",
            },
            {
              title: "4. Event Registration",
              body: "When you register for an event, you commit to attending unless you cancel in advance. Repeated no-shows may result in temporary registration restrictions. Event organizers may use your registration data for attendance purposes.",
            },
            {
              title: "5. Organizer Conduct",
              body: "Faculty and organizer accounts are responsible for ensuring event information is accurate and up-to-date. Misleading event postings or misuse of student data will result in account suspension.",
            },
            {
              title: "6. Code of Conduct",
              body: "All users must behave respectfully on the platform. Harassment, spam, or any form of abuse will result in immediate account termination. Events promoting discrimination or illegal activity are strictly prohibited.",
            },
            {
              title: "7. Intellectual Property",
              body: "Event content posted by organizers remains their property. By posting, they grant CampusEvents a non-exclusive license to display the content on the platform. Do not upload content you do not own.",
            },
            {
              title: "8. Limitation of Liability",
              body: "CampusEvents is provided as a convenience tool and is not liable for event cancellations, venue changes, or any losses arising from relying on platform information. Always confirm critical event details directly with the organizer.",
            },
            {
              title: "9. Changes to Terms",
              body: "We reserve the right to modify these terms at any time. Significant changes will be communicated via email. Continued use of the platform after changes constitutes acceptance of the new terms.",
            },
            {
              title: "10. Contact",
              body: "For questions about these Terms, contact the platform administrator at admin@college.edu.",
            },
          ].map((section) => (
            <div key={section.title} className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h2>
              <p className="text-gray-600 leading-relaxed">{section.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
