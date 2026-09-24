"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { getJob, getJobApplications, type DbJob, type DbJobApplication } from "@/lib/jobs";
import { ChevronLeft, Users, Mail, Phone, Calendar } from "lucide-react";
import { format } from "date-fns";

export default function JobApplicantsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [job, setJob] = useState<DbJob | null>(null);
  const [applicants, setApplicants] = useState<DbJobApplication[] | null>(null);

  useEffect(() => {
    getJob(id).then(setJob).catch(console.error);
    getJobApplications(id).then(setApplicants).catch(console.error);
  }, [id]);

  if (!job || !applicants) {
    return <div className="text-center py-20 text-gray-500">Loading applicants...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <Link href="/admin/jobs" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Jobs
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{job.title} — Applicants</h1>
            <p className="text-sm text-gray-500 mt-1">Review students who applied for this role.</p>
          </div>
          <div className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1.5">
            <Users className="w-4 h-4" /> {applicants.length} Applicants
          </div>
        </div>

        {applicants.length === 0 ? (
          <div className="py-20 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No one has applied for this job yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="text-xs uppercase bg-gray-50 text-gray-500 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 font-medium">Student Name</th>
                  <th className="px-6 py-4 font-medium">Contact</th>
                  <th className="px-6 py-4 font-medium">Applied On</th>
                  <th className="px-6 py-4 font-medium">Consent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applicants.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-900">{app.student_name}</p>
                    </td>
                    <td className="px-6 py-4 space-y-1">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail className="w-3.5 h-3.5" />
                        <a href={`mailto:${app.student_email}`} className="hover:text-indigo-600 hover:underline">
                          {app.student_email}
                        </a>
                      </div>
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-3.5 h-3.5" />
                        <a href={`tel:${app.student_phone}`} className="hover:text-indigo-600 hover:underline">
                          {app.student_phone}
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {format(new Date(app.created_at), "MMM d, yyyy")}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {app.consent_given ? (
                        <span className="text-xs font-semibold bg-green-100 text-green-700 px-2 py-1 rounded-md">
                          Granted
                        </span>
                      ) : (
                        <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-1 rounded-md">
                          Denied
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
