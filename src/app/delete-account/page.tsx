import Link from "next/link";
import { ArrowLeft, GraduationCap } from "lucide-react";

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">Spirits</span>
        </div>

        <Link href="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Delete Your Account</h1>
          <p className="text-sm text-gray-400 mb-8">Last updated: September 2026</p>

          <div className="space-y-8">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">How to request deletion</h2>
              <p className="text-gray-600 leading-relaxed">
                To delete your Spirits account and associated data, send an email to{" "}
                <a href="mailto:vigneshwarreddy.marthala@gmail.com?subject=Spirits%20Account%20Deletion%20Request" className="text-indigo-600 font-medium hover:underline">
                  vigneshwarreddy.marthala@gmail.com
                </a>{" "}
                from the email address associated with your account, with the subject line{" "}
                <span className="font-medium text-gray-800">&quot;Account Deletion Request&quot;</span>.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">What gets deleted</h2>
              <p className="text-gray-600 leading-relaxed">
                Once verified, we permanently delete your profile information (name, email, department, year),
                your event registrations, attendance records, and any survey responses you submitted, within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">What may be retained</h2>
              <p className="text-gray-600 leading-relaxed">
                Anonymized, aggregate attendance statistics that cannot be tied back to you may be retained for
                event reporting purposes. Records required for legal or audit compliance are retained only as long as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Questions</h2>
              <p className="text-gray-600 leading-relaxed">
                See our{" "}
                <Link href="/privacy-policy" className="text-indigo-600 font-medium hover:underline">
                  Privacy Policy
                </Link>{" "}
                for more detail on how your data is used, or reach out to the email above with any questions.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
