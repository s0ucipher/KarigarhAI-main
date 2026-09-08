// Buyer Shopping Cart & Checkout Screen

async function renderBuyerCartCheckout(container, params = {}) {
  const directProductId = params.directProductId;

  container.innerHTML = `
    <div class="p-6 text-center text-stone-500">
      <i class="fa-solid fa-spinner fa-spin text-3xl text-amber-700"></i>
      <p class="text-xs mt-2 font-medium">Preparing your cart...</p>
    </div>
  `;

  try {
    let items = [];
    let subtotal = 0;
    let deliveryFee = 0;
    let total = 0;

    if (directProductId) {
      // Direct buy single product
      const res = await api.getProduct(directProductId);
      const prod = res.product;
      items = [{
        cart_item_id: null,
        product_id: prod.id,
        name: prod.name,
        title: prod.title,
        price: prod.price,
        quantity: 1,
        stock_available: prod.quantity,
        is_available: prod.is_available,
        enhanced_image_url: prod.enhanced_image_url || prod.original_image_url,
        seller_name: prod.seller_name,
        seller_location: prod.seller_location
      }];
      subtotal = prod.price;
      deliveryFee = subtotal >= 999 ? 0 : 70;
      total = subtotal + deliveryFee;
    } else if (!api.token) {
      // Guest cart without direct product
      container.innerHTML = `
        <div class="p-4 space-y-4 max-w-lg mx-auto pb-28">
          <div class="flex items-center justify-between">
            <h1 class="text-base font-black text-stone-900 tracking-tight flex items-center gap-2">
              <i class="fa-solid fa-cart-shopping text-amber-700"></i> ${t("navCart")}
            </h1>
            <button id="btn-shop-more-guest" class="text-xs font-bold text-amber-800 hover:underline">
              ${t("navMarketplace")}
            </button>
          </div>

          <div class="bg-white border border-stone-200 rounded-3xl p-8 text-center text-stone-500">
            <div class="w-14 h-14 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
              <i class="fa-solid fa-cart-shopping"></i>
            </div>
            <h3 class="text-sm font-bold text-stone-800">Your Shopping Cart</h3>
            <p class="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
              Please log in to view your saved items, or discover authentic handmade crafts.
            </p>
            <div class="mt-5 flex items-center justify-center gap-2">
              <button id="btn-cart-login" class="bg-amber-700 hover:bg-amber-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow transition flex items-center gap-1.5">
                <i class="fa-solid fa-arrow-right-to-bracket text-[11px]"></i> ${t("login")}
              </button>
              <button id="btn-cart-shop" class="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2.5 px-4 rounded-xl text-xs transition">
                ${t("navMarketplace")}
              </button>
            </div>
          </div>
        </div>
      `;
      document.getElementById("btn-cart-login")?.addEventListener("click", () => {
        window.app.navigate("auth", { mode: "login" });
      });
      document.getElementById("btn-shop-more-guest")?.addEventListener("click", () => {
        window.app.navigate("buyer_marketplace");
      });
      document.getElementById("btn-cart-shop")?.addEventListener("click", () => {
        window.app.navigate("buyer_marketplace");
      });
      return;
    } else {
      const cartData = await api.getCart();
      items = cartData.items || [];
      subtotal = cartData.subtotal || 0;
      deliveryFee = cartData.delivery_fee || 0;
      total = cartData.total || 0;
    }

    // Default address values from user or mock
    const user = api.user || {};
    let savedAddr = {
      full_name: user.name || "Priya Sharma",
      phone: user.phone || "+91 98765 43210",
      street: "Flat 402, Green Glen Residency, Outer Ring Road",
      city: "Bengaluru",
      state: "Karnataka",
      pincode: "560103"
    };

    container.innerHTML = `
      <div class="p-4 space-y-4 max-w-lg mx-auto pb-28">
        <!-- Top Nav -->
        <div class="flex items-center justify-between">
          <button id="btn-back-market" class="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-stone-100">
            <i class="fa-solid fa-arrow-left"></i> Continue Shopping
          </button>
          <h1 class="text-base font-black text-stone-900">${t("shoppingCart")}</h1>
          <span class="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
            ${items.length} items
          </span>
        </div>

        ${items.length === 0 ? `
          <div class="bg-white border border-stone-200 rounded-3xl p-10 text-center text-stone-500">
            <div class="w-16 h-16 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
              <i class="fa-solid fa-cart-shopping"></i>
            </div>
            <h3 class="text-sm font-bold text-stone-800">${t("emptyCart")}</h3>
            <p class="text-xs text-stone-400 mt-1 max-w-xs mx-auto">Explore unique handmade pottery, paintings, and traditional crafts directly from Indian artisans.</p>
            <button id="btn-explore-crafts" class="mt-4 bg-amber-700 hover:bg-amber-800 text-white font-bold py-2.5 px-5 rounded-2xl text-xs shadow">
              Explore Marketplace
            </button>
          </div>
        ` : `
          <!-- Cart Items List -->
          <div class="space-y-3">
            ${items.map(item => `
              <div class="bg-white border border-stone-200 rounded-2xl p-3 shadow-xs flex items-center gap-3">
                <img src="${item.enhanced_image_url || '/static/images/products/terracotta_vase.jpg'}" 
                     class="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0">

                <div class="flex-1 min-w-0">
                  <h4 class="text-xs font-bold text-stone-900 truncate">${item.name}</h4>
                  <p class="text-[10px] text-stone-500">By ${item.seller_name || 'Artisan'}</p>
                  
                  <div class="flex items-center justify-between mt-2">
                    <span class="text-xs font-black text-amber-800">₹${item.price}</span>

                    ${!directProductId ? `
                      <!-- Quantity Stepper -->
                      <div class="flex items-center gap-2 border border-stone-200 rounded-xl px-2 py-1 bg-stone-50">
                        <button class="btn-cart-dec text-xs font-bold text-stone-600 hover:text-stone-900" data-item-id="${item.cart_item_id}" data-qty="${item.quantity - 1}">-</button>
                        <span class="text-xs font-black text-stone-900 px-1">${item.quantity}</span>
                        <button class="btn-cart-inc text-xs font-bold text-stone-600 hover:text-stone-900" data-item-id="${item.cart_item_id}" data-qty="${item.quantity + 1}">+</button>
                      </div>
                      <button class="btn-cart-del text-stone-400 hover:text-rose-600 text-xs p-1" data-item-id="${item.cart_item_id}">
                        <i class="fa-solid fa-trash"></i>
                      </button>
                    ` : `
                      <span class="text-xs font-bold text-stone-600">Qty: ${item.quantity}</span>
                    `}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Bill Summary Card -->
          <div class="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-2 text-xs">
            <h3 class="font-bold text-stone-800 uppercase tracking-wider text-[11px] mb-2">Order Price Summary</h3>
            <div class="flex justify-between text-stone-600">
              <span>${t("subtotal")}</span>
              <span class="font-bold text-stone-900">₹${subtotal}</span>
            </div>
            <div class="flex justify-between text-stone-600">
              <span>${t("deliveryFee")}</span>
              <span class="font-bold ${deliveryFee === 0 ? 'text-emerald-700' : 'text-stone-900'}">
                ${deliveryFee === 0 ? t('free') : `₹${deliveryFee}`}
              </span>
            </div>
            <div class="border-t border-stone-100 pt-2 flex justify-between text-sm font-black text-stone-900">
              <span>${t("totalAmount")}</span>
              <span class="text-amber-800">₹${total}</span>
            </div>
          </div>

          <!-- Delivery Address Form -->
          <div class="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3">
            <h3 class="font-bold text-stone-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <i class="fa-solid fa-location-dot text-amber-700"></i> ${t("deliveryAddress")}
            </h3>
            
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] font-bold text-stone-600 mb-1">${t("fullName")} *</label>
                <input type="text" id="addr-name" value="${savedAddr.full_name}" class="w-full px-2.5 py-2 text-xs rounded-xl border border-stone-300">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-stone-600 mb-1">${t("phone")} *</label>
                <input type="tel" id="addr-phone" value="${savedAddr.phone}" class="w-full px-2.5 py-2 text-xs rounded-xl border border-stone-300">
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-stone-600 mb-1">${t("streetAddress")} *</label>
              <input type="text" id="addr-street" value="${savedAddr.street}" class="w-full px-2.5 py-2 text-xs rounded-xl border border-stone-300">
            </div>

            <div class="grid grid-cols-3 gap-2">
              <div>
                <label class="block text-[10px] font-bold text-stone-600 mb-1">${t("city")} *</label>
                <input type="text" id="addr-city" value="${savedAddr.city}" class="w-full px-2 py-2 text-xs rounded-xl border border-stone-300">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-stone-600 mb-1">${t("state")} *</label>
                <input type="text" id="addr-state" value="${savedAddr.state}" class="w-full px-2 py-2 text-xs rounded-xl border border-stone-300">
              </div>
              <div>
                <label class="block text-[10px] font-bold text-stone-600 mb-1">${t("pincode")} *</label>
                <input type="text" id="addr-pincode" value="${savedAddr.pincode}" class="w-full px-2 py-2 text-xs rounded-xl border border-stone-300">
              </div>
            </div>
          </div>

          <!-- Payment Method Selector -->
          <div class="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-2">
            <h3 class="font-bold text-stone-800 uppercase tracking-wider text-[11px] mb-2 flex items-center gap-1.5">
              <i class="fa-solid fa-credit-card text-amber-700"></i> ${t("paymentMethod")}
            </h3>

            <label class="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
              <div class="flex items-center gap-2.5">
                <input type="radio" name="payment_method" value="Cash on Delivery" checked class="text-amber-700 focus:ring-amber-600">
                <span class="text-xs font-bold text-stone-800">${t("cod")}</span>
              </div>
              <span class="text-[10px] text-stone-500">Pay when delivered</span>
            </label>

            <label class="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
              <div class="flex items-center gap-2.5">
                <input type="radio" name="payment_method" value="UPI / QR Code" class="text-amber-700 focus:ring-amber-600">
                <span class="text-xs font-bold text-stone-800">${t("upi")}</span>
              </div>
              <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Instant</span>
            </label>

            <label class="flex items-center justify-between p-2.5 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
              <div class="flex items-center gap-2.5">
                <input type="radio" name="payment_method" value="Debit / Credit Card" class="text-amber-700 focus:ring-amber-600">
                <span class="text-xs font-bold text-stone-800">${t("card")}</span>
              </div>
              <span class="text-[10px] text-stone-500">Visa, Mastercard</span>
            </label>
          </div>

          <!-- Place Order Button -->
          <div class="pt-2">
            <button id="btn-place-order" class="w-full bg-amber-700 hover:bg-amber-800 text-white font-black py-4 rounded-2xl shadow-lg text-sm flex items-center justify-center gap-2 transition transform active:scale-98">
              <span>${t("placeOrder")} (₹${total})</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        `}
      </div>
    `;

    // Events
    document.getElementById("btn-back-market")?.addEventListener("click", () => {
      window.app.navigate("buyer_marketplace");
    });
    document.getElementById("btn-explore-crafts")?.addEventListener("click", () => {
      window.app.navigate("buyer_marketplace");
    });

    // Cart item quantity updates
    container.querySelectorAll(".btn-cart-inc").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-item-id");
        const qty = parseInt(btn.getAttribute("data-qty"));
        try {
          await api.updateCartItem(id, qty);
          renderBuyerCartCheckout(container);
          window.app.updateCartBadge();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });

    container.querySelectorAll(".btn-cart-dec").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-item-id");
        const qty = parseInt(btn.getAttribute("data-qty"));
        try {
          await api.updateCartItem(id, qty);
          renderBuyerCartCheckout(container);
          window.app.updateCartBadge();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });

    container.querySelectorAll(".btn-cart-del").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-item-id");
        try {
          await api.removeCartItem(id);
          renderBuyerCartCheckout(container);
          window.app.updateCartBadge();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });

    // Place Order
    document.getElementById("btn-place-order")?.addEventListener("click", async () => {
      const name = document.getElementById("addr-name").value.trim();
      const phone = document.getElementById("addr-phone").value.trim();
      const street = document.getElementById("addr-street").value.trim();
      const city = document.getElementById("addr-city").value.trim();
      const state = document.getElementById("addr-state").value.trim();
      const pincode = document.getElementById("addr-pincode").value.trim();

      if (!name || !phone || !street || !city || !pincode) {
        showToast("Please fill in all required delivery address fields", "error");
        return;
      }

      const paymentMethod = document.querySelector("input[name='payment_method']:checked")?.value || "Cash on Delivery";

      const orderPayload = {
        address: {
          full_name: name,
          phone: phone,
          street: street,
          city: city,
          state: state,
          pincode: pincode
        },
        payment_method: paymentMethod,
        direct_product_id: directProductId || null,
        direct_quantity: directProductId ? 1 : null
      };

      if (!api.token) {
        showToast(t("loginRequiredOrder"), "info");
        window.app.navigate("auth", { mode: "login" });
        return;
      }

      try {
        showToast("Submitting your handmade order...", "info");
        const res = await api.checkout(orderPayload);
        showToast("Order placed successfully! 🎉", "success");
        window.app.updateCartBadge();
        window.app.navigate("buyer_orders");
      } catch (err) {
        showToast(err.message, "error");
      }
    });

  } catch (err) {
    if (err.message && err.message.toLowerCase().includes("authentication")) {
      api.clearAuth();
      renderBuyerCartCheckout(container, params);
      return;
    }
    container.innerHTML = `<div class="p-6 text-center text-rose-600">${err.message}</div>`;
  }
}
