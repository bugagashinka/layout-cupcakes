//БАГА ПОСЛЕ ЗАГРУЗКИ, КАРТА ПУСТАЯ

$(function() {
  var CART_EXPIRE_TIME = 86400 * 1000; // 24 Hours
  var cartNode = $(".products-cart");
  var cartCountNode = $(".header__cart-count");
  var rellax = new Rellax(".rellax");

  // ********* Global *********

  // Clear cart every 24 hours
  checkCartExpireDate();

  // Init header cart counter
  initHeaderCartCounter();

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

  cartNode.click(function() {
    $(this).toggleClass("opened");
  });

  $(".prodcuts-cart__form").click(function(event) {
    event.stopPropagation();
  });

  function getCartItemTemplate(thumb, title, price, count, total) {
    return (
      " \
      <div class='products-cart__item'> \
        <span class='products-cart__item-close'>X</span>  \
        <div class='cart__item-thumb 'style='background-image: " +
      thumb +
      "'></div>  \
    <div class='cart__item-title'>" +
      title +
      "</div>  \
    <div class='cart__item-price'><span class='products__item-currency'>₴</span>" +
      price +
      "</div>  \
    <div class='count cart__item-count products__item-count'>  \
      <a class='button products__item-minus' href='#'>-</a>  \
      <input type='text' class='products__item-number' size='3' maxlength='3' value='" +
      count +
      "' readonly=''>  \
      <a class='button products__item-plus' href='#'>+</a>  \
    </div>  \
    <div class='cart__item-total'>  \
      <span class='products__item-currency'>₴</span>" +
      total +
      "</span>  \
    </div>  \
  </div>"
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
      cartProductsList.append(productTemplate);

      cartTotalPrice += product.price * product.count;

      // Add listener on cart panel product item
      addCartItemListeners(cartProductsList.children().last(), productTitle, cartModel, cartTotalPrice);
    });

    // Update total price cart counter
    cartNode.find(".products-cart__total-value").html(cartTotalPrice);
  });

  function addCartItemListeners(cartItem, productTitle, cartModel, cartTotalPrice) {
    cartItem.click(function(event) {
      event.preventDefault();

      var targetElementClasses = event.target.getAttribute("class");
      var itemCounterNode = $(this).find(".products__item-number");

      if (targetElementClasses.includes("products-cart__item-close")) {
        // Cross icon click listener, remove product from cart panel list
        event.currentTarget.remove();

        // Update header cart counter
        updateHeaderCartCounter(parseInt(cartCountNode.html()) - cartModel.products[productTitle].count);

        // Remove product from local storage
        delete cartModel.products[productTitle];
      } else if (targetElementClasses.includes("button products__item-minus")) {
        // Decrement product count button
        var productCount = parseInt(cartCountNode.html());
        if (productCount == 1) return;
        updateHeaderCartCounter(productCount - 1);
        itemCounterNode.val(parseInt(itemCounterNode.val()) - 1);
        cartModel.products[productTitle].count--;
        cartTotalPrice -= parseInt(cartModel.products[productTitle].price);
      } else if (targetElementClasses.includes("button products__item-plus")) {
        // Increment product count button
        var productCount = parseInt(cartCountNode.html());
        updateHeaderCartCounter(productCount + 1);
        itemCounterNode.val(parseInt(itemCounterNode.val()) + 1);
        cartModel.products[productTitle].count++;
        cartTotalPrice += parseInt(cartModel.products[productTitle].price);
      }

      // Update localStorage cart model
      updateCart(cartModel);

      // Update total price cart counter
      console.log(cartTotalPrice);
      cartNode.find(".products-cart__total-value").html(cartTotalPrice);
    });
  }

  // Cart panel
  $(".products-cart__close").click(function(event) {
    cartNode.toggleClass("opened");
    event.stopPropagation();
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
        addToCart({
          title: $(this)
            .find(".products__item-title")
            .html(),
          thumb: $(this)
            .find(".products__item-img")
            .css("background-image"),
          price: $(this)
            .find(".products__item-price")
            .html()
            .split("</span>")[1],
          count: productCount
        });
      }
    });

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
