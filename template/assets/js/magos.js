
$(function() {

  /* magos users sortable */
  $( ".magos-sortable" ).sortable({
    placeholder: "magos-sortable-highlight",
    items: "> div",
    handle: "h2",
    axis: "y",
    opacity: 0.6,
    forceHelperSize: true /* pitäisi olla laatikon kokoinen, ota css pois */
  });
  $( ".magos-sortable" ).disableSelection();
  
  /* magos potion dropbable */
  $( ".potion-icon" ).draggable({
    helper: "clone"
  });

  $( ".game-chest li:not(:empty)" ).droppable({
    greedy: true,
    accept: ".game-potion-icon",
    activeClass: "game-chest-hover",
    hoverClass: "game-chest-active",
    drop: function(event, ui) {
      var $tgt = $(this);
      $(".chest li").removeClass("ui-selected");
      $tgt.toggleClass("ui-selected");
    }
  });

  $( ".item-chest li:not(:empty)" ).droppable({
    greedy: true,
    accept: ".potion-icon",
    activeClass: "item-chest-hover",
    hoverClass: "item-chest-active",
    drop: function(event, ui) {
      var $tgt = $(this);

      $(".chest li").removeClass("ui-selected");

      $tgt.toggleClass("ui-selected");

      // do something with this information
      console.log("ui-selected item ID " + $tgt.attr('id'));
    }
  });
  
  /* magos potions */
  $( ".magos-potions-container" ).sortable({
    /*revert: true,*/
    items: "> div.magos-potions",
    handle: ".magos-image",
    /*helper: "clone",*/
    opacity: 0.8,
    connectWith: ".magos-potions-container"
  });

  $( ".magos-potions-container" ).droppable({
    greedy: true,
    accept: ".magos-potions",
    activeClass: "magos-potions-container-hover",
    hoverClass: "magos-potions-container-active"
  });

  /* magos component selectable */
  $( ".chest" ).selectable({
    filter: "> li:not(:empty)"
  });

  /* magos chest item image */
  $( ".item-chest-item-image, .game-chest-item-image" ).draggable({
    helper: "clone"
  });

  $( ".canvas-cell:empty" ).droppable({
    greedy: true,
    accept: ".item-chest-item-image",
    activeClass: "canvas-cell-hover",
    hoverClass: "canvas-cell-active",
    drop: function(event, ui) {
      var $tgt = $(this);
      
      if( ! $tgt.is(":empty") ) {
        return false;
      }
 
      var $el = $(ui.draggable).clone();
      $tgt.append( $el );
    }
  });

  $( ".canvas table" ).droppable({
    greedy: true,
    accept: ".game-chest-item-image",
    activeClass: "canvas-table-hover",
    hoverClass: "canvas-table-active",
    drop: function(event, ui) {
      var $tgt = $(this);
      var $el = $(ui.draggable);
      var bgimg = $el.data('url');

      $tgt.css({ "background-image": 'url('+bgimg+')' });
    }
  });

  //
  $('[rel^="tooltip"]').tooltip({ delay: { show: 500, hide: 100 }, placement: "top" });

});