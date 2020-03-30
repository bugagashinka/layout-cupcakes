$(function() {
  var CART_EXPIRE_TIME = 86400 * 1000; // 24 Hours
  var NOTIFICATION_EXPIRE = 1500; // ms
  var NOTIFICATION_FADEIN_TIME = 500; // ms
  var NOTIFICATION_FADEOUT_TIME = 500; // ms
  var DELIVERY_TIME = 90 * 60000; // minutes

  var CART_ORDER_BUTTON_TEXT1 = "Заказать";
  var CART_ORDER_BUTTON_TEXT2 = "Назад";

  var cartNode = $(".products-cart");
  var cartNotifyNode = $(".cart-notify");
  var cartCountNode = $(".header__cart-count");
  var rellax = new Rellax(".rellax");

  // ********* Global *********

  // Clear cart every 24 hours
  checkCartExpireDate();

  // Init header cart counter
  initHeaderCartCounter();

  // Initialize date and time fields on the order form
  $("#order-date").flatpickr({
    defaultDate: new Date(),
    minDate: new Date()
  });
  $("#order-time").flatpickr({
    noCalendar: true,
    time_24hr: true,
    enableTime: true,
    minDate: new Date(new Date().getTime() + DELIVERY_TIME),
    defaultDate: new Date(new Date().getTime() + DELIVERY_TIME),
    dateFormat: "H:i"
  });

  function headerTopScroll(pageSelector, heightFactor) {
    heightFactor = heightFactor || 1;
    $(document).scroll(function() {
      var $nav = $(pageSelector + " .header__top");
      $nav.toggleClass("scrolled", $(this).scrollTop() >= window.innerHeight * heightFactor - $nav.outerHeight() / 2);
    });
  }

  function updateHeaderCartCounter(count) {
    cartCountNode.html(count);
  }

  function initHeaderCartCounter() {
    var totalProducts = 0;
    var products = getCart().products;
    Object.keys(products).forEach(function(productTitle) {
      var product = products[productTitle];
      totalProducts += parseInt(product.count);
    });
    updateHeaderCartCounter(totalProducts);
  }

  function getCart() {
    var cart = JSON.parse(localStorage.getItem("cart") || "{}");
    cart.products = cart.products || {};
    return cart;
  }

  function checkCartExpireDate() {
    var cart = getCart();
    if (cart.date && new Date().getTime() - cart.date > CART_EXPIRE_TIME) {
      localStorage.removeItem("cart");
    }
  }

  function updateCart(newCart) {
    localStorage.setItem("cart", JSON.stringify(newCart));
  }

  $(".prodcuts-cart__form").click(function(event) {
    event.stopPropagation();
  });

  function getCartItemTemplate(thumb, title, price, count, total) {
    // prettier-ignore
    return (
      "<div class='products-cart__item'>" +
         "<span class='products-cart__item-close'>X</span>" +
         "<div class='cart__item-thumb 'style='background-image: " + thumb + "'></div>" +
         "<div class='cart__item-title'>" + title + "</div>" +
         "<div class='cart__item-price'><span class='products__item-currency'>₴</span>" + price + "</div>" +
         "<div class='count cart__item-count products__item-count'>" +
            "<a class='button products__item-minus' href='#'>-</a>" +
            "<input type='text' class='products__item-number' size='3' maxlength='3' value='" + count + "' readonly=''>" +
            "<a class='button products__item-plus' href='#'>+</a>" +
         "</div>" +
         "<div class='cart__item-total'>" +
           "<span class='products__item-currency'>₴</span>" +
             "<span class='cart__item-total-number'>" + total + "</span>" +
           "</span>" +
         "</div>" +
      "</div>"
    );
  }

  // Cart
  $(".header__cart").click(function(event) {
    cartNode.toggleClass("opened");
    event.preventDefault();

    var cartModel = getCart();
    var cartTotalPrice = 0;
    var cartProductsList = cartNode.find(".products-cart__list");

    // Clear cart panel list
    cartProductsList.empty();

    // Add product into cart panel list from localStorage cart
    Object.keys(cartModel.products).forEach(function(productTitle) {
      var product = cartModel.products[productTitle];
      var productTemplate = getCartItemTemplate(
        product.thumb,
        productTitle,
        parseInt(product.price),
        product.count,
        product.price * product.count
      );
      cartProductsList.prepend(productTemplate);

      cartTotalPrice += product.price * product.count;

      // Add listener on cart panel product item
      addCartItemListeners(cartProductsList.children().first(), productTitle, cartModel);
    });

    // Update total price cart counter
    cartNode.find(".products-cart__total-value").html(cartTotalPrice);
  });

  function addCartItemListeners(cartItem, productTitle, cartModel) {
    cartItem.click(function(event) {
      event.preventDefault();

      var targetElementClasses = event.target.getAttribute("class");
      var itemCounterNode = $(this).find(".products__item-number");
      var itemTotalNode = $(this).find(".cart__item-total-number");
      var cartTotalNode = cartNode.find(".products-cart__total-value");
      var cartTotalPrice = parseInt(cartTotalNode.html());

      if (targetElementClasses.includes("products-cart__item-close")) {
        // Cross icon click listener, remove product from cart panel list
        event.currentTarget.remove();

        // Update header cart counter
        updateHeaderCartCounter(parseInt(cartCountNode.html()) - cartModel.products[productTitle].count);

        // Decrease total price after delete
        cartTotalPrice -=
          parseInt(cartModel.products[productTitle].price) * parseInt(cartModel.products[productTitle].count);

        // Remove product from local storage
        delete cartModel.products[productTitle];
      } else if (targetElementClasses.includes("button products__item-minus")) {
        // Get product item counter value
        var productItemCount = parseInt(itemCounterNode.val());
        if (productItemCount == 1) return;

        // Decrease header cart counter
        updateHeaderCartCounter(parseInt(cartCountNode.html()) - 1);

        // Decrease product item counter value
        itemCounterNode.val(productItemCount - 1);

        // Decrease product count in localStorage
        cartModel.products[productTitle].count--;

        // Decrease cart panel total counter
        cartTotalPrice -= parseInt(cartModel.products[productTitle].price);

        // Update item total price
        itemTotalNode.html(cartModel.products[productTitle].count * cartModel.products[productTitle].price);
      } else if (targetElementClasses.includes("button products__item-plus")) {
        // Get product item counter value
        var productItemCount = parseInt(itemCounterNode.val());

        // Increase header cart counter
        updateHeaderCartCounter(parseInt(cartCountNode.html()) + 1);

        // Increase product item counter value
        itemCounterNode.val(productItemCount + 1);

        // Increase product count in localStorage
        cartModel.products[productTitle].count++;

        console.log(cartTotalPrice);
        // Increase cart panel total counter
        cartTotalPrice += parseInt(cartModel.products[productTitle].price);
        console.log(cartTotalPrice);

        // Update item total price
        itemTotalNode.html(cartModel.products[productTitle].count * cartModel.products[productTitle].price);
      }

      // Update localStorage cart model
      updateCart(cartModel);

      // Update total price cart counter
      cartTotalNode.html(cartTotalPrice);
    });
  }

  cartNode.click(function() {
    closeFullCartPanel(cartNode);
  });

  function closeFullCartPanel() {
    cartNode.find(".products-cart__order").html(CART_ORDER_BUTTON_TEXT1);
    cartNode.toggleClass("opened");
    if (cartNode.hasClass("full-opened")) cartNode.toggleClass("full-opened");
  }

  $(".prodcuts-cart__form").click(function(event) {
    event.stopPropagation();
    var target = event.target;

    if (target.getAttribute("class").includes("products-cart__close")) {
      closeFullCartPanel();
    } else if (target.getAttribute("class").includes("products-cart__order")) {
      event.preventDefault();

      if (!cartNode.find(".products-cart__list").children().length) return;

      if (target.innerHTML == CART_ORDER_BUTTON_TEXT2) {
        target.innerHTML = CART_ORDER_BUTTON_TEXT1;
      } else {
        target.innerHTML = CART_ORDER_BUTTON_TEXT2;
      }
      cartNode.toggleClass("full-opened");
    }
  });

  $(".prodcuts-cart__form").on("submit", function() {
    cartNode.toggleClass("full-opened");
    // Clear cart after send order
    updateCart({});
    closeFullCartPanel();
    updateHeaderCartCounter(0);
    $(this).trigger("reset");
  });

  // Animated scroll to target section
  $(document).on("click", 'a[href*="#"]', function(event) {
    var $nav = $(".header__top");

    var linkValue = $.attr(this, "href");
    if (linkValue.length == 1) return;

    var targetSection = $("#" + linkValue.split("#")[1]);

    $("html, body").animate(
      {
        scrollTop: targetSection.offset().top - $nav.outerHeight()
      },
      500
    );
  });

  // *** End Global ***

  // ********* Home page *********

  // Header slider
  $(".header__slider").slick({
    autoplay: true,
    autoplaySpeed: 3000,
    speed: 1200
  });

  // Header top menu section
  headerTopScroll(".home-content");

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

    //Products buy logic
    $(".products__item").click(function(event) {
      event.preventDefault();

      var target = event.target.getAttribute("class");
      var productCountInput = $(this).find(".products__item-number");
      var productCount = productCountInput.val();

      if (target.includes("products__item-minus")) {
        if (productCount == 1) return;
        productCountInput.val(--productCount);
      } else if (target.includes("products__item-plus")) {
        productCountInput.val(++productCount);
      } else if (target.includes("products__item-buy")) {
        var productImg = $(this)
          .find(".products__item-img")
          .css("background-image");

        var productTitle = $(this)
          .find(".products__item-title")
          .html();

        addToCart({
          title: productTitle,
          thumb: productImg,
          price: $(this)
            .find(".products__item-price")
            .html()
            .split("</span>")[1],
          count: productCount
        });

        // Notify about selected product
        showCartNotification(productTitle, productImg);
      }
    });

    function showCartNotification(title, thumb) {
      if (cartNotifyNode.css("display") == "none") {
        cartNotifyNode.find(".cart__item-title").html(title);
        cartNotifyNode.find(".cart-notify__thumb").css("background-image", thumb);

        cartNotifyNode
          .fadeIn(NOTIFICATION_FADEIN_TIME)
          .delay(NOTIFICATION_EXPIRE)
          .fadeOut(NOTIFICATION_FADEOUT_TIME);
      }
    }

    function addToCart(productModel) {
      var cart = getCart();

      var cartItem = cart.products[productModel.title];
      if (cartItem) {
        cartItem.count = Number(cartItem.count) + Number(productModel.count);
      } else {
        cartItem = { count: productModel.count };
      }
      cartItem.price = productModel.price;
      cartItem.thumb = productModel.thumb;
      cart.products[productModel.title] = cartItem;
      cart.date = new Date().getTime();
      updateCart(cart);

      // Update header_top cart counter
      updateHeaderCartCounter(parseInt(productModel.count) + parseInt(cartCountNode.html()));
    }

    // Product item rate
    $(".products__item-rate").rateYo({
      rating: 4,
      starWidth: "24px"
    });
  }

  // *** End Home page ***

  // ********* Delivery page *********

  // Header top menu section
  headerTopScroll(".delivery-content", 0.6);
  // *** End Delivery page ***

  // ********* Contacts page ************

  // Header top menu section
  headerTopScroll(".contacts-content", 0.65);

  // *** End Contacts page ***
});
