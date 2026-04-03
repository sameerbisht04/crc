/** Map Supabase Auth errors to clearer copy (e.g. rate limits). */
export function formatAuthError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("rate limit") || lower.includes("too many requests")) {
    return "Too many attempts from this network. Wait a few minutes and try again.";
  }
  if (
    lower.includes("invalid login") ||
    lower.includes("invalid credentials") ||
    lower.includes("invalid email or password")
  ) {
    return "Wrong email or password, or this account isn’t in Supabase yet. Use Sign up first, or confirm your email if Supabase requires it. (Accounts created only in the old app database won’t work here until you register in Supabase.)";
  }
  return message;
}
