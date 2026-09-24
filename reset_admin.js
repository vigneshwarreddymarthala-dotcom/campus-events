const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const lines = env.split('\n');
const supabaseUrl = lines.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL')).split('=')[1].replace(/"/g, '');
const anonKey = lines.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')).split('=')[1].replace(/"/g, '');
const serviceKey = lines.find(l => l.startsWith('SUPABASE_SERVICE_ROLE_KEY')).split('=')[1].replace(/"/g, '');

const supabaseAnon = createClient(supabaseUrl, anonKey);
const supabaseAdmin = createClient(supabaseUrl, serviceKey);

async function run() {
  const email = 'admin@college.edu';
  const password = 'Student@123';
  
  console.log("Signing up user...");
  const { data, error } = await supabaseAnon.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: "Admin User",
        role: "super_admin"
      }
    }
  });
  
  if (error) {
    console.error("SignUp error:", error);
    
    // Check if error is 'User already registered'
    if (error.message.includes("already registered")) {
      console.log("User exists. Updating password via admin API...");
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
      const user = users.find(u => u.email === email);
      if (user) {
        await supabaseAdmin.auth.admin.updateUserById(user.id, { password });
        await supabaseAdmin.from("profiles").update({ role: "super_admin" }).eq("id", user.id);
        console.log("Password and role updated successfully!");
      }
    }
    return;
  }
  
  console.log("SignUp successful! ID:", data.user?.id);
  
  if (data.user) {
    // force update role to super_admin in profiles table just in case
    await supabaseAdmin.from("profiles").upsert({
      id: data.user.id,
      name: "Admin User",
      email: email,
      role: "super_admin"
    });
    console.log("Role forced to super_admin.");
  }
}

run();
