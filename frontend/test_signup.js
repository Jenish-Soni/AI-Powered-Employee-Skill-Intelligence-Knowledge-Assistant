const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://iumccqwzxacfienozjdd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml1bWNjcXd6eGFjZmllbm96amRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2ODIzNjUsImV4cCI6MjA5NzI1ODM2NX0.WYKHqWP6ai5W8CXNabenHhpJNuH7aHIVE5JGiRM13lE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const users = [
    { email: 'admin@enterprise.com', password: 'password123', meta: { first_name: 'Admin', last_name: 'User', role: 'admin' } },
    { email: 'hr@enterprise.com', password: 'password123', meta: { first_name: 'HR', last_name: 'Manager', role: 'hr' } },
    { email: 'employee@enterprise.com', password: 'password123', meta: { first_name: 'Regular', last_name: 'Employee', role: 'employee' } }
  ];

  for (const u of users) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: { data: u.meta }
    });
    if (error) {
      console.log(`Failed to create ${u.email}:`, error.message);
    } else {
      console.log(`Created ${u.email}`);
    }
  }
}
main();
