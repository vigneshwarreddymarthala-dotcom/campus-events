"use client";

import { useState, useEffect } from "react";
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { applyForJob, hasUserApplied, type DbJob } from "@/lib/jobs";
import { CheckCircle2 } from "lucide-react";

export function ApplyJobModal({ job, open, onOpenChange }: { job: DbJob | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  const { user } = useAuth();
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applied, setApplied] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.phone) setPhone(user.phone);
    setConsent(false);
    setError(null);
    if (job && user && open) {
      hasUserApplied(job.id, user.id).then(setApplied).catch(console.error);
    }
  }, [user, job, open]);

  if (!job || !user) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!consent) {
      setError("You must consent to the data usage policy.");
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      await applyForJob({
        job_id: job!.id,
        user_id: user!.id,
        student_name: user!.name,
        student_email: user!.email,
        student_phone: phone,
        consent_given: consent,
      });
      setApplied(true);
    } catch (err: any) {
      setError(err.message || "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Apply for {job.title}</DialogTitle>
          <DialogDescription>
            {job.company}
          </DialogDescription>
        </DialogHeader>

        {applied ? (
          <div className="py-6 flex flex-col items-center text-center space-y-3">
            <div className="w-12 h-12 bg-green-100 text-green-600 flex items-center justify-center rounded-full mb-2">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Application Submitted!</h3>
            <p className="text-sm text-gray-500">
              The organizer has received your details. They will contact you using the information provided if there's a match.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-4 w-full">Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 pt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={user.name} disabled className="bg-gray-50 text-gray-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={user.email} disabled className="bg-gray-50 text-gray-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number <span className="text-red-500">*</span></Label>
                <Input 
                  id="phone" 
                  required 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 234 567 8900" 
                />
              </div>
              
              <div className="flex items-start space-x-3 pt-2 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <input
                  type="checkbox"
                  id="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <Label htmlFor="consent" className="text-xs font-normal text-gray-600 leading-relaxed cursor-pointer">
                  I accept that the data provided will be stored and used by the organizer for communication purposes regarding this job application. I have read and agree to the consent policy.
                </Label>
              </div>

              {error && (
                <p className="text-sm font-medium text-red-600 bg-red-50 p-3 rounded-md">{error}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700">
                {submitting ? "Submitting..." : "Submit Application"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
