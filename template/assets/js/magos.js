
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

  $( ".item-chest li:not(:empty), .game-chest li:not(:empty)" ).droppable({
    greedy: true,
    accept: ".potion-icon",
    activeClass: "item-chest-hover",
    hoverClass: "item-chest-active",
    drop: function(event, ui) {
      var $tgt = $(this);

      $(".chest li").removeClass("ui-selected");

      $tgt.toggleClass("ui-selected");

      var $draggable = $(ui.draggable),
        $container = $draggable.closest('.magos-potions-container'),
        potion = $draggable.data('potion');

      $container.find('.magos-potions.potions').hide('slide', { direction: "left" }, 250, function() {
        $container.find('.magos-potions.'+potion).show('slide', { direction: "right" }, 250);
      });

    }
  });

  /* magos potions */
  $( ".magos-potions-container" ).sortable({
    items: "> div.magos-potions",
    handle: ".magos-image",
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

  $( ".canvas-potion-icon" ).draggable({
    // helper: "clone"
  });

  $( ".canvas-cell:empty" ).droppable({
    greedy: true,
    accept: ".item-chest-item-image, .canvas-potion-icon",
    activeClass: "canvas-cell-hover",
    hoverClass: "canvas-cell-active",
    drop: function(event, ui) {
      var $tgt = $(this);

      if( ! $tgt.is(":empty") ) {
        return false;
      }

      //var $el = $(ui.draggable).clone();

      var $img = $('<img/>', {
          class: 'canvas-potion-icon',
          src: $(ui.draggable).attr("src")
      });
      //$el.removeClass("item-chest-item-image").addClass("canvas-potion-icon");
      
      $img.draggable();

      $tgt.append( $img ); //$el );
    }
  });
  
  $( ".item-trash" ).droppable({
    greedy: true,
    accept: ".item-chest-item-image",
    activeClass: "item-chest-hover",
    hoverClass: "item-chest-active",
    drop: function(event, ui) {
      $(ui.draggable).remove();
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

  $('.btn-grid').on('click tap', function(event){
    event.preventDefault();

    $tgt = $(event.target);

    $('.canvas table td').toggleClass('gridless');

    $tgt.toggleClass('active');
  });

  $('.btn-group-theme .btn, .btn-group-state .btn, .btn-group-scene .btn').on('click tap', function(event){
    event.preventDefault();

    $tgt = $(event.target);

    $tgt.siblings().removeClass("active");

    $tgt.addClass("active");
  });
  
  $('.btn-group-theme .btn').on('click tap', function(event){
    event.preventDefault();

    $tgt = $(event.target);

    $tgt.siblings().removeClass("active, btn-success");

    $tgt.addClass("active, btn-success");
  });

  $('.btn-back-potion').on('click tap', function(event) {
    event.preventDefault();

    var $tgt = $(event.target),
      $container = $tgt.closest('.magos-potions-container');

    $tgt.closest('.magos-potions').hide('slide', { direction: "right" }, 250, function() {
      $container.find('.magos-potions.potions').show('slide', { direction: "left" }, 250);
    });
/*
var $potions = $tgt.closest('.magos-potions'),
$actions = $potions.find('.collision-action:not(:first-child)');

$actions.each(function(index) {
var $action = $(this);

$action.find('select').each(function(index) {
if($(this).val() != "---") $action.remove();
});
  });
*/
  });

  $('.btn-add-action').on('click tap', function(event) {
    event.preventDefault();

    var $tgt = $(event.target),
      $form = $tgt.closest('form'),
      $clone = $form.find('.action-group:last');

      $form.find('.action-group:last').after( $clone.clone() );
  });

/*
  $( ".gravity-strength-slider" ).slider({
      range: "max",
      min: -4,
      max: 4,
      value: 2,
      slide: function( event, ui ) {
        console.log( $( "#amount" ).val( ui.value ) );
      }
    });
*/
});

