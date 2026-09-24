"use client";

import { useEffect, useState } from "react";
import { getJobs, getUserAppliedJobs, type DbJob, type DbJobApplicationWithJob } from "@/lib/jobs";
import { useAuth } from "@/contexts/auth-context";
import { Briefcase, MapPin, Building, ExternalLink, Calendar, DollarSign, Search, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { ApplyJobModal } from "@/components/shared/ApplyJobModal";

export default function StudentJobsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"discover" | "applied">("discover");
  
  const [jobs, setJobs] = useState<DbJob[] | null>(null);
  const [appliedJobs, setAppliedJobs] = useState<DbJobApplicationWithJob[] | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [applyJob, setApplyJob] = useState<DbJob | null>(null);

  useEffect(() => {
    getJobs().then(setJobs).catch(console.error);
    if (user) {
      getUserAppliedJobs(user.id).then(setAppliedJobs).catch(console.error);
    }
  }, [user]);

  // When modal closes, refresh the applied jobs list so the button changes to "Applied"
  const handleModalClose = (open: boolean) => {
    if (!open) {
      setApplyJob(null);
      if (user) {
        getUserAppliedJobs(user.id).then(setAppliedJobs).catch(console.error);
      }
    }
  };

  if (jobs === null || (user && appliedJobs === null)) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const appliedJobIds = new Set(appliedJobs?.map(a => a.job_id) || []);

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(search.toLowerCase()) || 
                          job.company.toLowerCase().includes(search.toLowerCase()) ||
                          job.location.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || job.type === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Job Board</h1>
        <p className="text-gray-500 mt-2 text-lg">Discover internships and full-time opportunities hand-picked for you.</p>
      </div>

      <div className="flex space-x-1 bg-gray-200/50 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab("discover")}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${
            activeTab === "discover" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Discover Jobs
        </button>
        <button
          onClick={() => setActiveTab("applied")}
          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
            activeTab === "applied" ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          My Applications
          {appliedJobs && appliedJobs.length > 0 && (
            <span className="bg-indigo-100 text-indigo-700 py-0.5 px-2 rounded-full text-xs">
              {appliedJobs.length}
            </span>
          )}
        </button>
      </div>

      {activeTab === "discover" ? (
        <>
          <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search by title, company, or location..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 border-gray-200"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="h-11 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:w-48"
            >
              <option value="all">All Types</option>
              <option value="Internship">Internship</option>
              <option value="Full-time">Full-time</option>
              <option value="Part-time">Part-time</option>
              <option value="Contract">Contract</option>
              <option value="Freelance">Freelance</option>
            </select>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Briefcase className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">No jobs available right now</h3>
              <p className="text-gray-500 mt-2 max-w-sm mx-auto">Check back later! The administration regularly posts new opportunities here.</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-20 text-gray-500">
              No jobs match your search criteria. Try adjusting your filters.
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {filteredJobs.map((job) => {
                const isApplied = appliedJobIds.has(job.id);
                return (
                  <div key={job.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-8 hover:shadow-lg transition-shadow group flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                          {job.title}
                        </h2>
                        <div className="flex items-center gap-2 text-gray-600 mt-2 font-medium">
                          <Building className="w-4 h-4" />
                          {job.company}
                        </div>
                      </div>
                      <div className="bg-indigo-50 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-lg shrink-0">
                        {job.type}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-x-6 gap-y-3 mt-2 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {job.location}
                      </div>
                      {job.salary_range && (
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          {job.salary_range}
                        </div>
                      )}
                      {job.deadline && (
                        <div className="flex items-center gap-1.5 text-amber-600 font-medium">
                          <Calendar className="w-4 h-4" />
                          Apply by {format(new Date(job.deadline), "MMM d")}
                        </div>
                      )}
                    </div>

                    <div className="text-gray-600 text-sm leading-relaxed mb-8 whitespace-pre-line line-clamp-4 flex-1">
                      {job.description}
                    </div>

                    <div className="mt-auto pt-2">
                      {isApplied ? (
                        <button disabled className="w-full flex items-center justify-center gap-2 bg-green-50 text-green-700 font-semibold py-3 rounded-xl border border-green-200">
                          <CheckCircle2 className="w-5 h-5" /> Applied
                        </button>
                      ) : (
                        <button 
                          onClick={() => setApplyJob(job)}
                          className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-colors"
                        >
                          Apply Now <ExternalLink className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-6">
          {!appliedJobs || appliedJobs.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-sm">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">You haven't applied to any jobs yet.</h3>
              <p className="text-gray-500 mt-2 max-w-sm mx-auto">Head back to the Discover tab to find your next opportunity.</p>
              <button onClick={() => setActiveTab("discover")} className="mt-6 text-indigo-600 font-semibold hover:underline">
                Browse Jobs
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              {appliedJobs.map((app) => (
                <div key={app.id} className="bg-white rounded-3xl border border-green-100 shadow-sm p-6 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-full bg-green-500" />
                  <h2 className="text-xl font-bold text-gray-900 mb-1">{app.jobs?.title || "Unknown Job"}</h2>
                  <div className="flex items-center gap-2 text-gray-600 font-medium mb-6">
                    <Building className="w-4 h-4" />
                    {app.jobs?.company || "Unknown Company"}
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-xl space-y-3 mt-auto">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Applied On:</span>
                      <span className="font-semibold text-gray-900">{format(new Date(app.created_at), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Status:</span>
                      <span className="font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md capitalize">
                        {app.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ApplyJobModal 
        job={applyJob} 
        open={!!applyJob} 
        onOpenChange={handleModalClose} 
      />
    </div>
  );
}
