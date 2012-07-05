$(function() {

    $("button").on("submit click tap", function(event) {
        event.preventDefault();
    });

    /* magos users sortable */
    $(".magos-sortable").sortable({
        placeholder: "magos-sortable-highlight",
        items: "> div",
        handle: "h2",
        axis: "y",
        opacity: 0.6,
        forceHelperSize: true
    });
    $(".magos-sortable").disableSelection();

    $(".main-sortable").sortable({
        placeholder: "magos-sortable-highlight",
        items: "> div",
        handle: "h3",
        axis: "y",
        opacity: 0.6,
        forceHelperSize: true
        /* pitäisi olla laatikon kokoinen, ota css pois */
    });
    $(".magos-sortable").disableSelection();

    /* magos potion dropbable */
    $(".potion-icon").draggable({
        helper: "clone"
    });

    $(".game-chest li:not(:empty)").droppable({
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

    $(".item-chest li:not(:empty), .game-chest li:not(:empty)").droppable({
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

            $container.find('.magos-potions.potions').hide('slide', {
                direction: "right"
            },
            250,
            function() {
                $container.find('.magos-potions.' + potion).show('slide', {
                    direction: "left"
                },
                250);
            });

        }
    });

    /* magos potions */
    $(".magos-potions-container").sortable({
        items: "> div.magos-potions",
        handle: ".magos-image",
        opacity: 0.8,
        connectWith: ".magos-potions-container"
    });

    $(".magos-potions-container").droppable({
        greedy: true,
        accept: ".magos-potions",
        activeClass: "magos-potions-container-hover",
        hoverClass: "magos-potions-container-active"
    });

    /* magos component selectable */
    $(".chest").selectable({
        filter: "> li:not(:empty)"
    });
    /*
    $(".chest-item, .game-item").on('click tap', function(event) {
        $tgt = $(event.target);
        $tgt.parent().trigger('selected').addClass('ui-selected');
    });
    */
    /* magos chest & game item image */
    $(".game-item").draggable({ helper: "clone" });

    $(".chest-item").draggable({
        helper: "clone",
        snap: ".canvas-cell:empty", 
        snapMode: "inner" /*,
        start: function(event, ui) {
          var $draggable = $(ui.draggable);
          $draggable.parent().trigger('selected').addClass('ui-selected');
        }*/
    });

    $(".canvas-cell:empty").droppable({
        greedy: true,
        accept: ".chest-item, .canvas-item",
        activeClass: "canvas-cell-hover",
        hoverClass: "canvas-cell-active",
        drop: function(event, ui) {
            var $tgt = $(this);
            //
            if (!$tgt.is(":empty")) {
                return false;
            }

            var $draggable = $(ui.draggable),
                $img = '';

            if($draggable.hasClass('chest-item')) {
              $img = $draggable.clone().removeAttr('data-original-title rel alt class style').addClass('canvas-item');
            } else {
              $img = $draggable.removeAttr('data-original-title rel alt class style').addClass('canvas-item');
            }

            $img.draggable({
                //zIndex: 9999,
                helper: "original",
                snap: ".canvas-cell:empty", 
                snapMode: "inner",
                revert: function(valid) {
                    if (!valid) $(this).remove();
                }
            });

            $tgt.append( $img );
        }
    });

    $(".trash-item").droppable({
        greedy: true,
        accept: ".chest-item, .canvas-item",
        activeClass: "item-chest-hover",
        hoverClass: "item-chest-active",
        drop: function(event, ui) {
            $draggable = $(ui.draggable);

            if($draggable.hasClass('chest-item')) { // chest item
              // ember stuff
              $draggable.parent().remove();
            } else { // canvas-item
              // ember stuff
              $draggable.remove();
            }
        }
    });

    $(".canvas .table-canvas").droppable({
        greedy: true,
        accept: ".game-item",
        activeClass: "canvas-table-hover",
        hoverClass: "canvas-table-active",
        drop: function(event, ui) {
            var $tgt = $(this);
            var $el = $(ui.draggable);
            var bgimg = $el.data('url');

            if(bgimg.length) {
              $tgt.siblings('.table-grid').css({
                  "background-image": 'url(' + bgimg + ')'
              });
            }
        }
    });

    //
    $('[rel^="tooltip"]').tooltip({
        delay: { show: 500, hide: 100 },
        placement: "top"
    });

    $('.btn-grid').on('click tap', function(event) {
        event.preventDefault();

        $tgt = $(event.target);

        $('.canvas table td').toggleClass('gridless');

        $tgt.toggleClass('active');
    });

    $('.btn-group-theme .btn, .btn-group-state .btn, .btn-group-scene .btn').on('click tap',
    function(event) {
        event.preventDefault();

        $tgt = $(event.target);

        $tgt.siblings().removeClass("active");

        $tgt.addClass("active");
    });

    $('.btn-group-theme .btn').on('click tap',
    function(event) {
        event.preventDefault();

        $tgt = $(event.target);

        $tgt.siblings().removeClass("active, btn-success");

        $tgt.addClass("active, btn-success");
    });

    $('.btn-back-potion').on('click tap',
    function(event) {
        event.preventDefault();

        var $tgt = $(event.target),
        $container = $tgt.closest('.magos-potions-container');

        $tgt.closest('.magos-potions').hide('slide', {
            direction: "left"
        },
        250,
        function() {
            $container.find('.magos-potions.potions').show('slide', {
                direction: "right" 
            }, 250);
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

        $clone = $clone.clone();

        if (!$clone.find('.btn-del-action').length) {

            var btn = '<button class="btn btn-danger btn-del-action pull-right"><i class="icon-minus"></i></button>';

            $clone.find('.control-group:first').prepend(btn);
        }

        $form.find('.action-group:last').after($clone);
    });

    $('.magos-potions').on('click tap', '.btn-del-action', function(event) {
        event.preventDefault();

        $tgt = $(event.target);

        $tgt.closest('.action-group').remove();
    });
    

    // modals
    
    $(".add-item").on('click tap', function(event) {
        event.preventDefault();

        $('#dialog-new-item').modal().on('show', function () {
          $(this).find('input').val('');
          $(this).find('.control-group').removeClass('error');
        })
    });

    $('.modal .btn').on('click tap', function(event) {
      event.preventDefault();

      $tgt = $(event.target);

      var action = $tgt.data('action');

      if(action === 'add-item') {

        var $form = $tgt.parent().siblings('.modal-body');
        var name = $form.find('input').val();

        if(name.length) {

          // check that unique

          var $li = $('<li/>');

          var $img = $('<img/>', {
              class: 'chest-item',
              src: 'http://placehold.it/32/E8117F',
              alt: name,
              title: name
          })
          .tooltip()
          .draggable({ helper: "clone" })
          .appendTo($li);

          $li.prependTo( $('.item-chest') );

          $tgt.siblings('[data-dismiss]').click();

        } else {
          $form.find('.control-group').addClass('error');
        }
      }

    });

});

var socket = io.connect('http://localhost/editor');

socket.on('connecting', function() {
    console.log('connecting to magos...');
});

socket.on('connect', function () {
  console.log('connected to magos!');
});

socket.emit('set-user-credentials', {"firstname": "Teemu", 'uid': "teemu", "role": "student"}, function (data) {
  console.log(data);
});

var slug = "super-magos";

socket.emit('get-game', slug, function(data) {
  console.log(data);
});

// update, delete, insert
var attr = { action: 'update' };
socket.emit('set-game-attr', attr, function(data) {
  
})

socket.emit('join-room', slug, function (data) {
  console.log( data );
  /*
  socket.emit('get room members', { 'game': 'super-magos' }, function(data) {
    console.log(data);
  });
  */
});

socket.on('chat-message', function (message) {
  console.log('chat message comming...');
  console.log(message);
});

var msg = 'jokin viesti kaikille editorin käyttäjille';
socket.emit('chat-message', msg, function(message) {
  console.log(message);
});
