/* Sawmill Tycoon — Android app settings for shared/gameroom-sdk.js (copied over shared/gameroom-config.js by pack.mjs).
   Until the real AdMob account exists these are Google's public TEST ids: test ads only, no revenue.
   When AdMob gives the real ids: put the ad unit ids here, set testing: false, and put the AdMob APP id
   in android/app/src/main/AndroidManifest.xml (com.google.android.gms.ads.APPLICATION_ID). */
window.GAMEROOM_CONFIG = {
  admob: {
    rewarded: 'ca-app-pub-3940256099942544/5224354917',
    interstitial: 'ca-app-pub-3940256099942544/1033173712',
    testing: true,
  },
  analytics: {},
};
