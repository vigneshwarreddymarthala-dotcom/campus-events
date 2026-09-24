"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getJobs, deleteJob, type DbJob } from "@/lib/jobs";
import { Button } from "@/components/ui/button";
import { Plus, Briefcase, MapPin, Building, Trash2, ExternalLink, Calendar, Users } from "lucide-react";
import { format } from "date-fns";

export default function AdminJobsPage() {
  const [jobs, setJobs] = useState<DbJob[] | null>(null);

  useEffect(() => {
    getJobs().then(setJobs).catch(console.error);
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete job post "${title}"? This cannot be undone.`)) return;
    await deleteJob(id).catch(console.error);
    setJobs((prev) => prev ? prev.filter((j) => j.id !== id) : []);
  };

  if (jobs === null) {
    return <div className="text-center py-20 text-gray-500">Loading jobs...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Job Board</h1>
          <p className="text-sm text-gray-500 mt-1">Manage employment and internship opportunities.</p>
        </div>
        <Link href="/admin/jobs/new">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2">
            <Plus className="w-4 h-4" />
            Post a Job
          </Button>
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-200">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No jobs posted</h3>
          <p className="text-gray-500 text-sm mt-1 mb-6">Create the first job posting for students to see.</p>
          <Link href="/admin/jobs/new">
            <Button variant="outline">Post a Job</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div key={job.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:border-indigo-200 hover:shadow-md transition-all flex flex-col h-full relative group">
              <div className="flex justify-between items-start mb-3">
                <div className="bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-md">
                  {job.type}
                </div>
                <button
                  onClick={() => handleDelete(job.id, job.title)}
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-1">{job.title}</h3>
              
              <div className="space-y-1.5 mt-3 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 shrink-0" />
                  <span className="truncate">{job.company}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{job.location}</span>
                </div>
                {job.deadline && (
                  <div className="flex items-center gap-2 text-amber-600">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>Apply by {format(new Date(job.deadline), "MMM d, yyyy")}</span>
                  </div>
                )}
              </div>

              <div className="mt-auto pt-5 space-y-2">
                <Link
                  href={`/admin/jobs/${job.id}/applicants`}
                  className="flex items-center justify-center gap-2 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-medium rounded-xl transition-colors text-sm border border-indigo-100"
                >
                  View Applicants <Users className="w-4 h-4" />
                </Link>
                {job.apply_link && (
                  <a 
                    href={job.apply_link} 
                    target="_blank"
                    className="flex items-center justify-center gap-2 w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium rounded-xl transition-colors text-sm border border-gray-200"
                  >
                    External Link <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
