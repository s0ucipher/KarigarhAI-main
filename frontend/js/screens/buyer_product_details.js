// Buyer Product Details Screen

async function renderBuyerProductDetails(container, params = {}) {
  const productId = params.productId;
  if (!productId) {
    window.app.navigate("buyer_marketplace");
    return;
  }

  container.innerHTML = `
    <div class="p-6 text-center text-stone-500">
      <i class="fa-solid fa-spinner fa-spin text-3xl text-amber-700"></i>
      <p class="text-xs mt-2 font-medium">Unfolding artisan craft story...</p>
    </div>
  `;

  try {
    const res = await api.getProduct(productId);
    const p = res.product;
    const similar = p.similar_products || [];

    let currentImg = p.enhanced_image_url || p.original_image_url;

    container.innerHTML = `
      <div class="pb-28 max-w-4xl mx-auto md:pt-4">
        <!-- Floating Back & Share Nav -->
        <div class="fixed top-3 inset-x-0 max-w-md md:max-w-4xl mx-auto px-4 z-30 flex items-center justify-between pointer-events-none">
          <button id="btn-back-marketplace" class="pointer-events-auto w-9 h-9 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-stone-800 hover:bg-white text-xs transition">
            <i class="fa-solid fa-arrow-left"></i>
          </button>
          <div class="flex items-center gap-2">
            <button id="btn-listen-story" class="pointer-events-auto bg-amber-700/90 hover:bg-amber-800 text-white text-[11px] font-bold py-1.5 px-3 rounded-full shadow-md backdrop-blur-md flex items-center gap-1.5 transition">
              <i class="fa-solid fa-volume-high"></i> Listen Story
            </button>
          </div>
        </div>

        <div class="md:grid md:grid-cols-2 md:gap-8 md:items-start md:px-4 md:pt-10">
          <!-- High-Res Hero Image Gallery -->
          <div class="relative w-full aspect-square bg-stone-100 overflow-hidden md:rounded-3xl md:shadow-md">
            <img id="detail-main-img" src="${currentImg}" alt="${p.name}" class="w-full h-full object-cover">

            <!-- Studio Enhanced Badge -->
            <div class="absolute bottom-3 left-4 flex gap-1.5">
              <button id="toggle-enhanced" class="bg-amber-800/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow backdrop-blur-xs flex items-center gap-1">
                <i class="fa-solid fa-wand-magic-sparkles text-amber-300"></i> AI Studio
              </button>
              <button id="toggle-original" class="bg-black/60 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow backdrop-blur-xs">
                Original Photo
              </button>
            </div>
          </div>

          <!-- Product Core Info -->
          <div class="p-4 md:p-0 space-y-4">
            <div>
              <div class="flex items-center justify-between mb-1">
                <span class="text-xs font-bold text-amber-800 uppercase tracking-wider">${p.category_name_en || 'Handmade'}</span>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${p.quantity > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                  ${p.quantity > 0 ? `${p.quantity} available` : 'Sold out'}
                </span>
              </div>
              <h1 class="text-base sm:text-lg font-black text-stone-900 leading-snug">${p.title || p.name}</h1>

              <div class="flex items-baseline gap-2 mt-2">
                <span class="text-xl font-black text-stone-900">₹${p.price}</span>
                ${p.original_price && p.original_price > p.price ? `
                  <span class="text-xs text-stone-400 line-through">₹${p.original_price}</span>
                  <span class="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                    ${Math.round(((p.original_price - p.price) / p.original_price) * 100)}% off
                  </span>
                ` : ''}
              </div>
            </div>

            <!-- Craftsman Story Card -->
            <div class="bg-gradient-to-r from-amber-50 to-orange-50/60 border border-amber-200/80 rounded-2xl p-4 shadow-xs">
              <div class="flex items-center gap-3 mb-2.5">
                <img src="${p.seller_avatar || '/static/images/avatars/artisan1.png'}" 
                     class="w-12 h-12 rounded-full border-2 border-amber-300 object-cover shadow-xs">
                <div>
                  <div class="flex items-center gap-1.5">
                    <h3 class="text-xs font-black text-stone-900">${p.seller_name}</h3>
                    <span class="text-[9px] bg-amber-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                      ${p.seller_badge || 'Artisan'}
                    </span>
                  </div>
                  <p class="text-[11px] text-amber-900 font-semibold">${p.seller_craft || 'Master Craftsman'}</p>
                  <p class="text-[10px] text-stone-500"><i class="fa-solid fa-location-dot text-amber-700"></i> ${p.seller_location || 'India'}</p>
                </div>
              </div>

              <p class="text-xs text-stone-700 leading-relaxed italic border-t border-amber-200/60 pt-2">
                "${p.seller_bio || 'Every piece is lovingly made by hand to bring timeless Indian traditional craft into your home.'}"
              </p>
            </div>

            <!-- Craft Heritage & Description -->
            <div class="space-y-2">
              <h3 class="text-xs font-bold text-stone-900 uppercase tracking-wider">${t("craftDetails")}</h3>
              <p class="text-xs text-stone-700 leading-relaxed">${p.description}</p>
            </div>

            <!-- Specifications Table -->
            <div class="bg-stone-50 rounded-2xl p-3 border border-stone-200 text-xs space-y-2">
              <div class="flex justify-between">
                <span class="text-stone-500">${t("materials")}</span>
                <span class="font-bold text-stone-900">${p.material || 'Natural Clay & Organic Dyes'}</span>
              </div>
              <div class="flex justify-between border-t border-stone-200/60 pt-1.5">
                <span class="text-stone-500">${t("origin")}</span>
                <span class="font-bold text-stone-900">${p.seller_location || 'India'}</span>
              </div>
              <div class="flex justify-between border-t border-stone-200/60 pt-1.5">
                <span class="text-stone-500">Craft Technique</span>
                <span class="font-bold text-stone-900">${p.craft_details || 'Handmade on traditional wheel'}</span>
              </div>
            </div>

            <!-- Tags -->
            ${(p.tags || []).length > 0 ? `
              <div class="flex flex-wrap gap-1.5 pt-1">
                ${p.tags.map(t => `
                  <span class="text-[10px] font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded-md">
                    #${t}
                  </span>
                `).join('')}
              </div>
            ` : ''}

            <!-- Similar Recommendations -->
            ${similar.length > 0 ? `
              <div class="pt-3">
                <h3 class="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2.5">
                  ${t("similarRecommendations")}
                </h3>
                <div class="grid grid-cols-2 gap-2.5">
                  ${similar.map(sim => `
                    <div class="bg-white border border-stone-200 rounded-xl p-2 cursor-pointer hover:border-amber-600 transition similar-item" data-id="${sim.id}">
                      <img src="${sim.enhanced_image_url || sim.original_image_url}" class="w-full aspect-square object-cover rounded-lg mb-1.5">
                      <div class="text-[11px] font-bold text-stone-900 truncate">${sim.name}</div>
                      <div class="text-xs font-black text-amber-800">₹${sim.price}</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Bottom Fixed Action Bar -->
        <div class="fixed bottom-0 inset-x-0 max-w-md md:max-w-4xl mx-auto bg-white/95 backdrop-blur-md border-t border-stone-200 p-3 z-30 flex items-center gap-2.5 shadow-lg">
          <button id="btn-add-to-cart-detail" class="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2 transition">
            <i class="fa-solid fa-cart-plus"></i>
            <span>${t("addToCart")}</span>
          </button>

          <button id="btn-buy-now-detail" class="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-black py-3.5 rounded-2xl text-xs shadow-md flex items-center justify-center gap-2 transition">
            <span>${t("buyNow")}</span>
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      </div>
    `;

    // Events
    document.getElementById("btn-back-marketplace")?.addEventListener("click", () => {
      window.app.navigate("buyer_marketplace");
    });

    // Toggle images
    const mainImg = document.getElementById("detail-main-img");
    document.getElementById("toggle-enhanced")?.addEventListener("click", () => {
      if (mainImg) mainImg.src = p.enhanced_image_url || p.original_image_url;
    });
    document.getElementById("toggle-original")?.addEventListener("click", () => {
      if (mainImg) mainImg.src = p.original_image_url;
    });

    // Listen to Story
    document.getElementById("btn-listen-story")?.addEventListener("click", () => {
      speakText(`${p.title}. Crafted by ${p.seller_name} in ${p.seller_location}. ${p.description}`);
    });

    // Add to Cart
    document.getElementById("btn-add-to-cart-detail")?.addEventListener("click", async () => {
      if (!api.token) {
        showToast(t("loginRequiredCart"), "info");
        window.app.navigate("auth", { mode: "login" });
        return;
      }
      try {
        await api.addToCart(p.id, 1);
        showToast("Added to your shopping cart!", "success");
        window.app.updateCartBadge();
      } catch (err) {
        showToast(err.message, "error");
      }
    });

    // Buy Now -> Directly proceed to checkout
    document.getElementById("btn-buy-now-detail")?.addEventListener("click", () => {
      window.app.navigate("buyer_cart_checkout", { directProductId: p.id });
    });

    // Similar items
    container.querySelectorAll(".similar-item").forEach(item => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        renderBuyerProductDetails(container, { productId: id });
      });
    });

  } catch (err) {
    if (err.message && err.message.toLowerCase().includes("authentication")) {
      api.clearAuth();
      renderBuyerProductDetails(container, params);
      return;
    }
    container.innerHTML = `<div class="p-6 text-center text-rose-600">${err.message}</div>`;
  }
}
