/* Per-deployment settings for shared/gameroom-sdk.js. The web version keeps the defaults (no analytics key,
   AdMob test ids are unused on the web). The Android packaging (mobile/) replaces this file with the app's
   real AdMob ids and analytics key, so games never hard-code them. */
window.GAMEROOM_CONFIG = window.GAMEROOM_CONFIG || {
  analytics: {},
};
