"use client";

import { useEffect, useState } from "react";
import { getJobs, type DbJob } from "@/lib/jobs";
import { Button } from "@/components/ui/button";
import { Briefcase, MapPin, Building, ExternalLink, Calendar, DollarSign, Search } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";

export default function StudentJobsPage() {
  const [jobs, setJobs] = useState<DbJob[] | null>(null);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  useEffect(() => {
    getJobs().then(setJobs).catch(console.error);
  }, []);

  if (jobs === null) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

      {/* Filters */}
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
          {filteredJobs.map((job) => (
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
                <a 
                  href={job.apply_link || "#"}
                  target="_blank"
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 rounded-xl transition-colors"
                >
                  Apply Now <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
