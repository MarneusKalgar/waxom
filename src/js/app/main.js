jQuery(function($) {
  var $header = $(".header");
  var scrollTop;
  $(window).on('scroll', function() {
    scrollTop = $(window).scrollTop();
    if (scrollTop > 0) {
      $header.addClass("header_isScrolled");
    } else {
      $header.removeClass("header_isScrolled");
    }
  });
});
