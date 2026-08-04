import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: August 2026</p>

          {[
            {
              title: "1. Information We Collect",
              body: "We collect: (a) Account data — name, college email, department, year, and phone number you provide during registration. (b) Usage data — events you viewed, registered for, and bookmarked. (c) Device data — browser type, IP address, and operating system for security purposes.",
            },
            {
              title: "2. How We Use Your Information",
              body: "Your data is used to: provide and improve the CampusEvents platform, send event reminders and notifications you opt into, allow organizers to see registrant lists for events you sign up for, generate anonymized analytics to improve event discovery, and prevent fraud and enforce our terms.",
            },
            {
              title: "3. Data Sharing",
              body: "We share data only with: (a) Event organizers — who can see your name, email, department, and year when you register for their event. (b) College administration — on request for legitimate administrative purposes. We do not sell your data to third parties.",
            },
            {
              title: "4. Data Retention",
              body: "Account data is retained while your account is active. If you delete your account, personal data is removed within 30 days, except where required for audit or legal compliance. Registration history is retained in anonymized form.",
            },
            {
              title: "5. Push Notifications",
              body: "You can opt in to push notifications for event reminders and new events matching your interests. You can change notification preferences at any time in your account settings. We will not send promotional notifications from third parties.",
            },
            {
              title: "6. Security",
              body: "We use industry-standard security measures including encrypted connections (HTTPS), hashed passwords, and regular security audits. However, no system is 100% secure — please use a strong, unique password and log out on shared devices.",
            },
            {
              title: "7. Your Rights",
              body: "You have the right to: access the personal data we hold about you, request correction of inaccurate data, request deletion of your account and associated data, and opt out of non-essential communications. Contact admin@college.edu to exercise these rights.",
            },
            {
              title: "8. Cookies",
              body: "We use essential cookies to keep you logged in and maintain your preferences. We do not use advertising or tracking cookies. You can clear cookies at any time through your browser settings, though this will log you out.",
            },
            {
              title: "9. Children's Privacy",
              body: "CampusEvents is intended for college students (18+). We do not knowingly collect data from individuals under 18. If you believe a minor has registered, contact us immediately.",
            },
            {
              title: "10. Contact Us",
              body: "For privacy-related questions or requests, contact: admin@college.edu. We will respond within 7 business days.",
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
