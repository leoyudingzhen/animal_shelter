// Add your Supabase project URL and anon key from Project Settings > API.
// Never use the service role key in browser code.
const supabase = window.supabase.createClient(
  "https://YOUR_PROJECT.supabase.co",
  "YOUR_SUPABASE_ANON_KEY"
);

// Find the login window, form, header button, and status message.
const dialog = document.querySelector("#auth-dialog");
const loginButton = document.querySelector("#login-button");
const form = document.querySelector("#auth-form");
const message = document.querySelector("#auth-message");
let signingUp = false;

// Look up the signed-in user's role and show it beside the logout button.
async function showUserRole(session) {
  if (!session) {
    loginButton.textContent = "Log In";
    return;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", session.user.id)
    .single();

  const role = error ? "User" : data.role;
  const roleName = role.charAt(0).toUpperCase() + role.slice(1);
  loginButton.textContent = `${roleName} · Log Out`;
}

// Open login, or sign out when a user is already logged in.
loginButton.onclick = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session) await supabase.auth.signOut();
  else dialog.showModal();
};

document.querySelector("#auth-close").onclick = () => dialog.close();

// Switch the form between logging in and creating an account.
document.querySelector("#auth-switch").onclick = (event) => {
  signingUp = !signingUp;
  document.querySelector("#auth-title").textContent = signingUp ? "Create your account" : "Welcome back";
  document.querySelector("#auth-submit").textContent = signingUp ? "Create Account" : "Log In";
  event.currentTarget.textContent = signingUp ? "Already have an account? Log in" : "Create an account";
  document.querySelector("#auth-password").autocomplete = signingUp ? "new-password" : "current-password";
  message.textContent = "";
};

// Update the header whenever Supabase reports a login or logout.
supabase.auth.onAuthStateChange((_event, session) => {
  // Run the profile lookup after Supabase finishes its session update.
  setTimeout(() => showUserRole(session), 0);
});
supabase.auth.getSession().then(({ data: { session } }) => showUserRole(session));

// Ask Supabase to create the account or verify the login credentials.
form.onsubmit = async (event) => {
  event.preventDefault();
  const email = form.elements.email.value;
  const password = form.elements.password.value;
  const result = signingUp
    ? await supabase.auth.signUp({ email, password })
    : await supabase.auth.signInWithPassword({ email, password });

  message.textContent = result.error
    ? result.error.message
    : signingUp && !result.data.session
      ? "Check your email to confirm your account."
      : "You're logged in!";

  if (!result.error && result.data.session) dialog.close();
};
