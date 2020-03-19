$(function() {
  // *** Global ***

  // Animated scroll to target section
  $(document).on("click", 'a[href^="#"]', function(event) {
    event.preventDefault();
    var $nav = $(".header__top");
    $("html, body").animate(
      {
        scrollTop: $($.attr(this, "href")).offset().top - $nav.outerHeight()
      },
      500
    );
  });

  // *** End Global ***

  // *** Home page ***

  // Header slider
  $(".header__slider").slick({
    autoplay: true,
    autoplaySpeed: 3000,
    speed: 1200
  });

  // Header top menu section
  $(document).scroll(function() {
    var $nav = $(".header__top");
    $nav.toggleClass("scrolled", $(this).scrollTop() >= window.innerHeight - $nav.outerHeight() / 2);
  });

  // *** End Home page ***
});
