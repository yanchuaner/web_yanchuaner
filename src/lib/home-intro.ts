export const HOME_INTRO_VERSION = "yanzhong-system-v3";
export const HOME_INTRO_REPLAY_EVENT = "yz:replay-home-intro";

const SESSION_KEY = "yz-intro-seen";
const VERSION_KEY = "yz-intro-version";

export function shouldShowHomeIntro() {
  try {
    if (sessionStorage.getItem(SESSION_KEY) === HOME_INTRO_VERSION) return false;
  } catch {
    // Persistent storage can be unavailable in hardened privacy modes.
  }

  try {
    return localStorage.getItem(VERSION_KEY) !== HOME_INTRO_VERSION;
  } catch {
    return true;
  }
}

export function markHomeIntroSeen() {
  try {
    sessionStorage.setItem(SESSION_KEY, HOME_INTRO_VERSION);
  } catch {
    // The experience still completes when session storage is unavailable.
  }

  try {
    localStorage.setItem(VERSION_KEY, HOME_INTRO_VERSION);
  } catch {
    // The version marker is an optional display preference, not core state.
  }
}
