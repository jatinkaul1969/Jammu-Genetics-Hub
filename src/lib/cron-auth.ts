// Shared auth gate for the /api/cron/* routes. Nothing in the app calls
// these — an external scheduler does. Two accepted forms:
//   • Vercel Cron: sends `Authorization: Bearer <CRON_SECRET>` automatically
//     when a CRON_SECRET env var exists on the project.
//   • Anything else (OS cron, curl, uptime pinger): pass `?secret=<value>`.
// If CRON_SECRET isn't set at all, the routes stay open (fine for local dev).
export function isAuthorizedCronRequest(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;

  const url = new URL(req.url);
  if (url.searchParams.get("secret") === secret) return true;

  const auth = req.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;

  return false;
}
