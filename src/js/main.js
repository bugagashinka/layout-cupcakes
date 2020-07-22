$(function () {
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

  // ********* Global *********

  // Menu
  $(".header__menu-btn").click(function () {
    $(".header__menu-list").toggleClass("header__menu-list_visible");
  });

  // Restricts input for each element in the set of matched elements to the given inputFilter.
  $.fn.inputFilter = function (inputFilter) {
    return this.on("input keydown keyup mousedown mouseup select contextmenu drop", function () {
      if (inputFilter(this.value)) {
        this.oldValue = this.value;
        this.oldSelectionStart = this.selectionStart;
        this.oldSelectionEnd = this.selectionEnd;
      } else if (this.hasOwnProperty("oldValue")) {
        this.value = this.oldValue;
        this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
      } else {
        this.value = "";
      }
    });
  };

  // Clear cart every 24 hours
  checkCartExpireDate();

  // Init header cart counter
  initHeaderCartCounter();

  // Initialize date and time fields on the order form
  $("#order-date").flatpickr({
    defaultDate: new Date(),
    minDate: new Date(),
  });
  $("#order-time").flatpickr({
    noCalendar: true,
    time_24hr: true,
    enableTime: true,
    minDate: new Date(new Date().getTime() + DELIVERY_TIME),
    defaultDate: new Date(new Date().getTime() + DELIVERY_TIME),
    dateFormat: "H:i",
  });

  function headerTopScroll(pageSelector, heightFactor) {
    heightFactor = heightFactor || 1;
    var $nav = $(pageSelector + " .header__top");

    $(document).scroll(function () {
      $nav.toggleClass("scrolled", $(this).scrollTop() >= window.innerHeight * heightFactor - $nav.outerHeight() / 2);
    });

    // Single check, set color for 'header__top' after page reload
    $nav.toggleClass("scrolled", $(document).scrollTop() >= window.innerHeight * heightFactor - $nav.outerHeight() / 2);
  }

  function updateHeaderCartCounter(count) {
    cartCountNode.html(count);
  }

  function initHeaderCartCounter() {
    var totalProducts = 0;
    var products = getCart().products;
    Object.keys(products).forEach(function (productTitle) {
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

  $(".products-cart__form").click(function (event) {
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
  $(".header__cart").click(function (event) {
    cartNode.toggleClass("opened");
    event.preventDefault();

    var cartModel = getCart();
    var cartTotalPrice = 0;
    var cartProductsList = cartNode.find(".products-cart__list");

    // Clear cart panel list
    cartProductsList.empty();

    // Add product into cart panel list from localStorage cart
    Object.keys(cartModel.products).forEach(function (productTitle) {
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
    cartItem.click(function (event) {
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

        if (Object.keys(cartModel.products).length == 0) {
          updateCart({});
          closeFullCartPanel();
          updateHeaderCartCounter(0);
        }
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

        // Increase cart panel total counter
        cartTotalPrice += parseInt(cartModel.products[productTitle].price);

        // Update item total price
        itemTotalNode.html(cartModel.products[productTitle].count * cartModel.products[productTitle].price);
      }

      // Update localStorage cart model
      updateCart(cartModel);

      // Update total price cart counter
      cartTotalNode.html(cartTotalPrice);
    });
  }

  cartNode.click(function () {
    closeFullCartPanel(cartNode);
  });

  function closeFullCartPanel() {
    cartNode.find(".products-cart__order").html(CART_ORDER_BUTTON_TEXT1);
    cartNode.toggleClass("opened");
    if (cartNode.hasClass("full-opened")) cartNode.toggleClass("full-opened");
  }

  $(".products-cart__form").click(function (event) {
    event.stopPropagation();
    var target = event.target;
    var orderButton = this.querySelector(".products-cart__order");

    if (target.classList.contains("products-cart__close")) {
      closeFullCartPanel();
    } else if (target.classList.contains("products-cart__order") || target.classList.contains("order-subform__close")) {
      event.preventDefault();

      if (!cartNode.find(".products-cart__list").children().length) return;

      orderButton.textContent =
        orderButton.textContent == CART_ORDER_BUTTON_TEXT2 ? CART_ORDER_BUTTON_TEXT1 : CART_ORDER_BUTTON_TEXT2;

      cartNode.toggleClass("full-opened");
    }
  });

  $(".products-cart__form").on("submit", function () {
    cartNode.toggleClass("full-opened");
    // Clear cart after send order
    updateCart({});
    closeFullCartPanel();
    updateHeaderCartCounter(0);
    $(this).trigger("reset");
  });

  // Animated scroll to target section
  $(document).on("click", 'a[href*="#"]', function (event) {
    var $nav = $(".header__top");

    var linkValue = $.attr(this, "href");
    if (linkValue.length == 1) return;

    var targetSection = $("#" + linkValue.split("#")[1]);

    $("html, body").animate(
      {
        scrollTop: targetSection.offset().top - $nav.outerHeight(),
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
    speed: 1200,
  });

  // Header top menu section
  headerTopScroll(".home-content");

  // Products section
  var products = $(".products");
  if (products) {
    // Products category
    var tabs = products.find(".products-tab");
    tabs.click(function (event) {
      if ($(this).hasClass("active")) return;

      var id = $(this).attr("data-id");
      products.find(".products-tab__content").hide();
      tabs.removeClass("active");
      $(this).addClass("active");
      $("#category-" + id).show();
    });

    // Products subcategory
    var subcategoryList = products.find(".subcategory-title");
    subcategoryList.click(function (event) {
      $(this).toggleClass("shrink");
    });

    //Products buy logic
    products.find(".products__item").click(function (event) {
      event.preventDefault();

      var target = event.target.getAttribute("class");
      var productCountInput = $(this).find(".products__item-number");
      var productCount = productCountInput.val();

      if (target.includes("products__item-info")) {
        $.magnificPopup.instance.open(Object.assign({}, popupConfig, { index: $(this).index(".products__item") }));
      } else if (target.includes("products__item-minus")) {
        if (productCount == 1) return;
        productCountInput.val(--productCount);
      } else if (target.includes("products__item-plus")) {
        productCountInput.val(++productCount);
      } else if (target.includes("products__item-buy")) {
        var productImg = $(this).find(".products__item-img").css("background-image");

        var productTitle = $(this).find(".products__item-title").html();

        addToCart({
          title: productTitle,
          thumb: productImg,
          price: $(this).find(".products__item-price-value").html(),
          count: productCount,
        });

        // Notify about selected product
        showCartNotification(productTitle, productImg);
      }
    });

    function showCartNotification(title, thumb) {
      if (cartNotifyNode.css("display") == "none") {
        cartNotifyNode.find(".cart__item-title").html(title);
        cartNotifyNode.find(".cart-notify__thumb").css("background-image", thumb);

        cartNotifyNode.fadeIn(NOTIFICATION_FADEIN_TIME).delay(NOTIFICATION_EXPIRE).fadeOut(NOTIFICATION_FADEOUT_TIME);
      }
    }

    function addToCart(productModel) {
      console.log("Add to cart", productModel);
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

    // Initalize product details data for popup window:
    var productsDetails = Array.from(products.find(".products__item")).map(function (productItemNode) {
      return {
        image: productItemNode.querySelector(".products__item-img").style.backgroundImage,
        title: productItemNode.querySelector(".products__item-title").innerHTML,
        price: productItemNode.querySelector(".products__item-price-value").innerHTML,
        description: productItemNode.querySelector(".products__item-descr").innerHTML.trim(),
        count: productItemNode.querySelector(".products__item-number").value,
      };
    });

    var popupConfig = {
      key: "products-popup",
      items: productsDetails,
      type: "inline",
      inline: {
        // prettier-ignore
        markup:
        '<section class="product-details product-details__popup">' +
          '<div class="mfp-close product-datails__close-btn"></div>' +
          '<div class="product-details__inner">' +
            '<div class="product-details__img" style="background-image: url();"></div>' +
            '<div class="product-details__content">' +
              '<div class="product-details__title"></div>' +
              '<div class="product-details__subtitle">' +
                '<span class="product-details__price">' +
                  '<span class="products__item-currency">&#8372;</span>' +
                  '<span class="product-details__price-value"></span>' +
                '</span>' +
                '<span class="product-details__rate"></span>' +
              '</div>' +
              '<p class="product-details__descr"></p>' +
              '<div class="product-details__controls">' +
                '<input class="product-details__count" maxlength="3" type="text" value=""/>' +
                '<a class="product-details-buy products__item-buy" href="#">В корзину</a>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</section>'
      },
      gallery: {
        enabled: true,
      },
      callbacks: {
        markupParse: function (template, values, item) {
          // Product details rate
          template.find(".product-details__rate").rateYo({
            rating: 4,
            starWidth: "24px",
          });
          template.find(".product-details__count").inputFilter(function (value) {
            return /^\d*$/.test(value) && value > 0;
          });

          var thumb = template.find(".product-details__img").css("background-image", values.image);
          var title = template.find(".product-details__title").html(values.title);
          var price = template.find(".product-details__price-value").html(values.price);
          template.find(".product-details__descr").html(values.description);
          var count = template.find(".product-details__count").val(values.count);

          console.log(template);
          console.log("!!!", template.find(".product-details-buy"));

          template.find(".product-details-buy").click(function (event) {
            event.preventDefault();
            $.magnificPopup.instance.close();
            addToCart({
              title: title.html(),
              thumb: thumb.css("background-image"),
              price: price.html(),
              count: count.val(),
            });
          });
        },
      },
    };
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
