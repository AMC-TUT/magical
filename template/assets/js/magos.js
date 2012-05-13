
$(function() {
  
  

  /* magos users sortable */
  $( ".magos-sortable" ).sortable({
    //placeholder: "ui-state-highlight",
    items: "> div",
    handle: "h2"
  });
  $( ".magos-sortable" ).disableSelection();
  
  /* magos potion dropbable */
  $( ".potion-icon" ).draggable({
    /*revert: true, */
    helper: "clone"
  });
  $( ".item-chest li:not(:empty)" ).droppable({
    greedy: true,
    accept: ".potion-icon",
    activeClass: "ui-state-hover",
    hoverClass: "ui-state-active"
  });
  
  /* magos potions */
  $( ".magos-potions-container" ).sortable({
    /*revert: true,*/
    items: "> div.magos-potions",
    handle: ".magos-image",
    helper: "clone",
    opacity: 0.8,
    connectWith: ".magos-potions-container"
  });
  $( ".magos-potions-container" ).droppable({
    greedy: true,
    accept: ".magos-potions",
    activeClass: "ui-state-hover",
    hoverClass: "ui-state-active"
  });

  /* magos component selectable */
  $( ".chest" ).selectable({
    filter: "> li:not(:empty)"
  });

  /* magos chest item image */
  $( ".item-chest-item-image, .game-chest-item-image" ).draggable({
    helper: "clone",
    /* revert: true */
  });
  $( ".canvas-cell:empty" ).droppable({
    greedy: true,
    accept: ".item-chest-item-image",
    activeClass: "ui-state-hover",
    hoverClass: "ui-state-active",
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
    activeClass: "ui-state-hover",
    hoverClass: "ui-state-active",
    drop: function(event, ui) {
      var $tgt = $(this);
      var $el = $(ui.draggable);
      var bgimg = $el.data('url');

      $tgt.css({ "background-image": 'url('+bgimg+')' });
    }
  });

});