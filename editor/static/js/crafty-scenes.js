//
// Loading
//
Crafty.scene("Loading", function() {
  Crafty.e("HTML").append('<br/><br/><div class="hero-unit span8 offset1"><div class="row"></div><div class="row"><div class="progress progress-warning active"><div class="bar"></div></div></div></div>');

  Crafty.load(
    [
      "images/menu/bg.png"
    ],
    function() {
      Crafty.scene("Intro");
    },
    function(e) {
      $(".progress .bar").css("width", Math.round(e.percent) + "%");
    },
    function(e) {
      alert('Error loading ' + e.src + ' while loading game assets (loaded ' + e.loaded + ' of ' + e.total + ')');
    }
  );
});