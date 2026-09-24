import { createClient } from "@/utils/supabase/client";

export type DbJob = {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  salary_range: string | null;
  apply_link: string | null;
  deadline: string | null;
  created_at: string;
};

export async function getJobs(): Promise<DbJob[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") { // Table does not exist
      return [];
    }
    throw error;
  }
  return data ?? [];
}

export async function getJob(id: string): Promise<DbJob | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function createJob(payload: Omit<DbJob, "id" | "created_at">): Promise<DbJob> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("jobs")
    .insert(payload)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function deleteJob(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("jobs").delete().eq("id", id);
  if (error) throw error;
}

// -- Applications --

export type DbJobApplication = {
  id: string;
  job_id: string;
  user_id: string;
  student_name: string;
  student_email: string;
  student_phone: string;
  consent_given: boolean;
  status: string;
  created_at: string;
};

export async function applyForJob(payload: Omit<DbJobApplication, "id" | "created_at" | "status">): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("job_applications")
    .insert({ ...payload, status: "pending" });
    
  if (error) {
    if (error.code === "23505") {
      throw new Error("You have already applied for this job.");
    }
    throw error;
  }
}

export async function getJobApplications(jobId: string): Promise<DbJobApplication[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .select("*")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error) {
    if (error.code === "42P01") return []; // Table doesn't exist
    throw error;
  }
  return data ?? [];
}

export async function hasUserApplied(jobId: string, userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("job_applications")
    .select("id")
    .eq("job_id", jobId)
    .eq("user_id", userId)
    .maybeSingle();
    
  if (error && error.code !== "42P01") throw error;
  return !!data;
}
