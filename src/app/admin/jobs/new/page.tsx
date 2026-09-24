"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/jobs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ChevronLeft, Briefcase, Building, MapPin, DollarSign, Link as LinkIcon, Calendar } from "lucide-react";
import Link from "next/link";

export default function CreateJobPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const formData = new FormData(e.currentTarget);
    const payload = {
      title: formData.get("title") as string,
      company: formData.get("company") as string,
      location: formData.get("location") as string,
      type: formData.get("type") as string,
      description: formData.get("description") as string,
      salary_range: formData.get("salary_range") as string || null,
      apply_link: formData.get("apply_link") as string || null,
      deadline: formData.get("deadline") as string || null,
    };

    try {
      await createJob(payload);
      router.push("/admin/jobs");
      router.refresh();
    } catch (err: any) {
      console.error(err);
      alert(`Failed to create job.\nError: ${err.message || JSON.stringify(err)}`);
      setSaving(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto pb-12">
      <Link href="/admin/jobs" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ChevronLeft className="w-4 h-4 mr-1" /> Back to Jobs
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gray-50 border-b border-gray-200 px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900">Post a New Job</h1>
          <p className="text-sm text-gray-500 mt-1">Fill in the details to publish a new job opportunity for students.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input id="title" name="title" required className="pl-9" placeholder="e.g. Software Engineer Intern" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company Name <span className="text-red-500">*</span></Label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input id="company" name="company" required className="pl-9" placeholder="e.g. Google, Startup Inc." />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input id="location" name="location" required className="pl-9" placeholder="e.g. Remote, New York, NY" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Job Type <span className="text-red-500">*</span></Label>
              <select 
                id="type" 
                name="type" 
                required 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="Internship">Internship</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Contract">Contract</option>
                <option value="Freelance">Freelance</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description <span className="text-red-500">*</span></Label>
            <Textarea 
              id="description" 
              name="description" 
              required 
              rows={5}
              placeholder="Describe the role, responsibilities, and requirements..." 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="salary_range">Salary Range</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input id="salary_range" name="salary_range" className="pl-9" placeholder="$60k - $80k" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Application Deadline</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input type="date" id="deadline" name="deadline" className="pl-9" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="apply_link">Apply Link (URL)</Label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input type="url" id="apply_link" name="apply_link" className="pl-9" placeholder="https://..." />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700">
              {saving ? "Posting..." : "Post Job"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
