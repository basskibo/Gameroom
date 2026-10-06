/* Prazan adapter. Igre zovu samo ovaj sloj.
   Pravi portali (CrazyGames, Poki, …) zamenjuju ove funkcije kad se uključe. */
(function () {
  if (window.Gameroom && window.Gameroom.__ready) return;
  window.Gameroom = {
    __ready: true,
    init: function () {},
    gameplayStart: function () {},
    gameplayStop: function () {},
    showRewarded: function () { return Promise.resolve(false); },
    showMidgame: function () { return Promise.resolve(); },
    track: function () {},
  };
})();
