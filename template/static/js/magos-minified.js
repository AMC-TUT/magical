$(function(){$("button").on("submit click tap",function(e){e.preventDefault()}),$(".magos-sortable").sortable({placeholder:"magos-sortable-highlight",items:"> div",handle:"h2",axis:"y",opacity:.6,forceHelperSize:!0}),$(".magos-sortable").disableSelection(),$(".main-sortable").sortable({placeholder:"magos-sortable-highlight",items:"> div",handle:"h3",axis:"y",opacity:.6,forceHelperSize:!0}),$(".magos-sortable").disableSelection(),$(".potion-icon").draggable({helper:"clone"}),$(".game-chest li:not(:empty)").droppable({greedy:!0,accept:".game-potion-icon",activeClass:"game-chest-hover",hoverClass:"game-chest-active",drop:function(e,t){var n=$(this);$(".chest li").removeClass("ui-selected"),n.toggleClass("ui-selected")}}),$(".item-chest li:not(:empty), .game-chest li:not(:empty)").droppable({greedy:!0,accept:".potion-icon",activeClass:"item-chest-hover",hoverClass:"item-chest-active",drop:function(e,t){var n=$(this);$(".chest li").removeClass("ui-selected"),n.toggleClass("ui-selected");var r=$(t.draggable),i=r.closest(".magos-potions-container"),s=r.data("potion");i.find(".magos-potions.potions").hide("slide",{direction:"right"},250,function(){i.find(".magos-potions."+s).show("slide",{direction:"left"},250)})}}),$(".magos-potions-container").sortable({items:"> div.magos-potions",handle:".magos-image",opacity:.8,connectWith:".magos-potions-container"}),$(".magos-potions-container").droppable({greedy:!0,accept:".magos-potions",activeClass:"magos-potions-container-hover",hoverClass:"magos-potions-container-active"}),$(".game-item").draggable({helper:"clone"}),$(".canvas-cell:empty").droppable({greedy:!0,accept:".chest-item, .canvas-item",activeClass:"canvas-cell-hover",hoverClass:"canvas-cell-active",drop:function(e,t){var n=$(this);if(!n.is(":empty"))return!1;var r=$(t.draggable),i="";r.hasClass("chest-item")?i=r.clone().removeAttr("data-original-title rel alt class style").addClass("canvas-item"):i=r.removeAttr("data-original-title rel alt class style").addClass("canvas-item"),i.draggable({helper:"original",snap:".canvas-cell:empty",snapMode:"inner",revert:function(e){e||$(this).remove()}}),n.append(i)}}),$(".trash-item").droppable({greedy:!0,accept:".chest-item, .canvas-item",activeClass:"item-chest-hover",hoverClass:"item-chest-active",drop:function(e,t){$draggable=$(t.draggable),$draggable.hasClass("game-item")?$draggable.parent().remove():$draggable.remove()}}),$(".canvas .table-canvas").droppable({greedy:!0,accept:".game-item",activeClass:"canvas-table-hover",hoverClass:"canvas-table-active",drop:function(e,t){var n=$(this),r=$(t.draggable),i=r.data("url");i.length&&n.siblings(".table-grid").css({"background-image":"url("+i+")"})}}),$(".btn-group-theme .btn, .btn-group-state .btn, .btn-group-scene .btn").on("click tap",function(e){e.preventDefault(),$tgt=$(e.target),$tgt.siblings().removeClass("active"),$tgt.addClass("active")}),$(".btn-back-potion").on("click tap",function(e){e.preventDefault();var t=$(e.target),n=t.closest(".magos-potions-container");t.closest(".magos-potions").hide("slide",{direction:"left"},250,function(){n.find(".magos-potions.potions").show("slide",{direction:"right"},250)})}),$(".btn-add-action").on("click tap",function(e){e.preventDefault();var t=$(e.target),n=t.closest("form"),r=n.find(".action-group:last");r=r.clone();if(!r.find(".btn-del-action").length){var i='<button class="btn btn-danger btn-del-action pull-right"><i class="icon-minus"></i></button>';r.find(".control-group:first").prepend(i)}n.find(".action-group:last").after(r)}),$(".magos-potions").on("click tap",".btn-del-action",function(e){e.preventDefault(),$tgt=$(e.target),$tgt.closest(".action-group").remove()})});var pathname=window.location.pathname,slug=pathname.replace(/^\//,"").replace(/\/$/,"");