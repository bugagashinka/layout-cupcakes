$(function() {
  var rellax = new Rellax(".rellax");

  // *** Global ***

  // Animated scroll to target section
  $(document).on("click", 'a[href*="#"]', function(event) {
    var $nav = $(".header__top");
    var targetSection = $("#" + $.attr(this, "href").split("#")[1]);
    console.log(targetSection);
    $("html, body").animate(
      {
        scrollTop: targetSection.offset().top - $nav.outerHeight()
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
    var $nav = $(".home-content .header__top");
    $nav.toggleClass("scrolled", $(this).scrollTop() >= window.innerHeight - $nav.outerHeight() / 2);
  });

  // Products section
  var products = $(".products");
  if (products) {
    // Products category
    var tabs = products.find(".products-tab");
    tabs.click(function(event) {
      if ($(this).hasClass("active")) return;

      var id = $(this).attr("data-id");
      products.find(".products-tab__content").hide();
      tabs.removeClass("active");
      $(this).addClass("active");
      $("#category-" + id).show();
    });

    // Products subcategory
    var subcategoryList = products.find(".subcategory-title");
    subcategoryList.click(function(event) {
      $(this).toggleClass("shrink");
    });

    // Product item rate
    $(".products__item-rate").rateYo({
      rating: 4,
      starWidth: "24px"
    });
  }

  // *** End Home page ***
});
