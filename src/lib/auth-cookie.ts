/**
 * Keep authentication cookies usable for HTTP staging while requiring Secure
 * cookies for HTTPS deployments. An explicit override takes precedence so a
 * reverse proxy setup can declare its policy directly.
 */
export function authCookieSecure() {
  const override = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();
  if (override === "true") return true;
  if (override === "false") return false;

  const configuredUrl = process.env.APP_URL || process.env.SITE_URL;
  if (configuredUrl) {
    try {
      return new URL(configuredUrl).protocol === "https:";
    } catch {
      // Fall back to the deployment mode when the URL is malformed.
    }
  }

  return process.env.NODE_ENV === "production";
}
