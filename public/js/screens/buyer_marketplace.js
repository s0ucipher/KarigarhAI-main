// Buyer Marketplace & Product Discovery Screen

async function renderBuyerMarketplace(container) {
  container.innerHTML = `
    <div class="p-6 text-center text-stone-500">
      <i class="fa-solid fa-spinner fa-spin text-3xl text-amber-700"></i>
      <p class="text-xs mt-2 font-medium">Discovering handmade treasures...</p>
    </div>
  `;

  try {
    const [categoriesRes, productsRes] = await Promise.all([
      api.getCategories(),
      api.getProducts()
    ]);

    const categories = categoriesRes.categories || [];
    let allProducts = productsRes.products || [];
    let selectedCategory = "all";
    let searchQuery = "";

    function renderView() {
      // Filter products
      let filtered = allProducts;
      if (selectedCategory !== "all") {
        filtered = filtered.filter(p => p.category_slug === selectedCategory || p.category_id == selectedCategory);
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(p => 
          p.name.toLowerCase().includes(q) ||
          p.title.toLowerCase().includes(q) ||
          (p.seller_name && p.seller_name.toLowerCase().includes(q)) ||
          (p.material && p.material.toLowerCase().includes(q)) ||
          (p.tags && p.tags.some(t => t.toLowerCase().includes(q)))
        );
      }

      container.innerHTML = `
        <div class="space-y-4 pb-24 md:pb-12">
          <!-- Top Sticky Search & Delivery Banner -->
          <div class="p-3 sm:p-4 bg-white border-b border-stone-100 shadow-xs sticky top-0 z-20">
            <div class="max-w-7xl mx-auto">
              <!-- Search Bar -->
              <div class="relative mb-2">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <i class="fa-solid fa-magnifying-glass text-xs"></i>
                </span>
                <input type="text" id="marketplace-search-input" value="${searchQuery}" 
                       placeholder="${t('searchPlaceholder')}"
                       class="w-full pl-9 pr-9 py-2.5 text-xs rounded-2xl bg-stone-100 border border-transparent focus:bg-white focus:border-amber-600 focus:outline-none transition">
                ${searchQuery ? `
                  <button id="btn-clear-search" class="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-600 text-xs">
                    ✕
                  </button>
                ` : ''}
              </div>

              <!-- Free Delivery Tagline -->
              <div class="flex flex-wrap items-center justify-between gap-1 text-[10px] sm:text-[11px] text-amber-900 bg-amber-50/80 px-3 py-1.5 rounded-xl border border-amber-200/60 font-medium">
                <span class="flex items-center gap-1.5">
                  <i class="fa-solid fa-truck-fast text-amber-700"></i> ${t("freeDeliveryTag")}
                </span>
                <span class="font-bold text-amber-800">100% Authentic Indian Craft</span>
              </div>
            </div>
          </div>

          <!-- Hero Mission Banner -->
          <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div class="bg-gradient-to-r from-amber-800 to-amber-950 rounded-3xl p-4 sm:p-6 text-white shadow-md relative overflow-hidden">
              <div class="relative z-10 max-w-md">
                <span class="bg-amber-500/30 border border-amber-400/40 text-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Direct From Rural Artisans
                </span>
                <h2 class="text-base sm:text-xl font-black mt-2 leading-tight">Every craft carries the soul of its maker.</h2>
                <p class="text-xs sm:text-sm text-amber-200/80 mt-1 leading-normal">
                  Skip the middlemen. Directly support master potters, weavers, and folk artists across India.
                </p>
              </div>
              <div class="absolute -right-4 -bottom-6 text-7xl sm:text-9xl opacity-15 pointer-events-none">
                <i class="fa-solid fa-hands-holding-circle"></i>
              </div>
            </div>
          </div>

          <!-- Category Filter Pills -->
          <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div class="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button class="category-pill shrink-0 px-3.5 py-2 rounded-2xl text-xs font-bold border transition ${selectedCategory === 'all' ? 'bg-amber-700 text-white border-amber-700 shadow-sm' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'}" data-cat="all">
                ${t("allCategories")}
              </button>
              ${categories.map(cat => {
                const isSelected = selectedCategory === cat.slug;
                const catName = currentLanguage === 'hi' ? cat.name_hi : (currentLanguage === 'bn' ? cat.name_bn : cat.name_en);
                return `
                  <button class="category-pill shrink-0 px-3.5 py-2 rounded-2xl text-xs font-bold border transition flex items-center gap-1.5 ${isSelected ? 'bg-amber-700 text-white border-amber-700 shadow-sm' : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50'}" data-cat="${cat.slug}">
                    <i class="fa-solid ${cat.icon} text-[11px] ${isSelected ? 'text-amber-200' : 'text-amber-700'}"></i>
                    <span>${catName}</span>
                  </button>
                `;
              }).join('')}
            </div>
          </div>

          <!-- Featured Artisans Section -->
          <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between mb-2.5">
              <h3 class="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
                <i class="fa-solid fa-crown text-amber-600"></i> ${t("featuredArtisans")}
              </h3>
            </div>
            
            <div class="flex gap-2.5 overflow-x-auto no-scrollbar pb-1">
              <!-- Artisan 1 -->
              <div class="shrink-0 w-44 bg-white border border-stone-200 rounded-2xl p-3 shadow-xs text-center flex flex-col justify-between">
                <div>
                  <img src="/static/images/avatars/artisan1.png" class="w-12 h-12 rounded-full mx-auto mb-1.5 border-2 border-amber-300 object-cover">
                  <h4 class="text-xs font-bold text-stone-900 truncate">Ramesh Kumbhakar</h4>
                  <p class="text-[10px] text-amber-800 font-semibold">Terracotta Sculptor</p>
                  <p class="text-[9px] text-stone-400">Bishnupur, Bengal</p>
                </div>
                <button class="btn-filter-seller mt-2 w-full py-1 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200/60" data-seller-id="1">
                  View Crafts
                </button>
              </div>

              <!-- Artisan 2 -->
              <div class="shrink-0 w-44 bg-white border border-stone-200 rounded-2xl p-3 shadow-xs text-center flex flex-col justify-between">
                <div>
                  <img src="/static/images/avatars/artisan2.png" class="w-12 h-12 rounded-full mx-auto mb-1.5 border-2 border-rose-300 object-cover">
                  <h4 class="text-xs font-bold text-stone-900 truncate">Meera Devi</h4>
                  <p class="text-[10px] text-amber-800 font-semibold">Madhubani Folk Artist</p>
                  <p class="text-[9px] text-stone-400">Madhubani, Bihar</p>
                </div>
                <button class="btn-filter-seller mt-2 w-full py-1 text-[10px] font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200/60" data-seller-id="2">
                  View Crafts
                </button>
              </div>
            </div>
          </div>

          <!-- Product Grid -->
          <div class="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-bold text-stone-900 uppercase tracking-wider">
                Crafts (${filtered.length})
              </h3>
              ${selectedCategory !== 'all' || searchQuery ? `
                <button id="btn-reset-filters" class="text-[11px] text-amber-700 font-bold hover:underline">
                  Reset filters
                </button>
              ` : ''}
            </div>

            ${filtered.length === 0 ? `
              <div class="bg-white border border-stone-200 rounded-2xl p-8 text-center text-stone-500">
                <i class="fa-solid fa-magnifying-glass text-3xl text-stone-300 mb-2"></i>
                <p class="text-xs font-bold text-stone-700">No matching handmade crafts found</p>
                <p class="text-[11px] text-stone-400 mt-1">Try another craft name or explore all categories.</p>
              </div>
            ` : `
              <div class="product-grid grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
                ${filtered.map(p => `
                  <div class="product-card bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between cursor-pointer" data-product-id="${p.id}">
                    <!-- Image with AI Studio badge -->
                    <div class="relative w-full aspect-square bg-stone-100 overflow-hidden">
                      <img src="${p.enhanced_image_url || p.original_image_url}" alt="${p.name}"
                           class="w-full h-full object-cover transition duration-300 hover:scale-105">
                      <span class="absolute top-2 left-2 bg-black/60 text-white text-[8px] font-black px-1.5 py-0.5 rounded backdrop-blur-xs flex items-center gap-1">
                        <i class="fa-solid fa-wand-magic-sparkles text-amber-300"></i> AI Enhanced
                      </span>
                    </div>

                    <!-- Details -->
                    <div class="p-3 flex-1 flex flex-col justify-between">
                      <div>
                        <div class="text-[10px] text-amber-800 font-bold uppercase tracking-wider">${p.category_name_en || 'Handmade'}</div>
                        <h4 class="text-xs font-bold text-stone-900 line-clamp-2 mt-0.5 leading-snug">${p.name}</h4>
                        <div class="flex items-center gap-1 text-[10px] text-stone-500 mt-1">
                          <i class="fa-solid fa-hammer text-amber-700 text-[9px]"></i>
                          <span class="truncate">${p.seller_name || 'Artisan'}</span>
                        </div>
                      </div>

                      <div class="mt-2.5 pt-2 border-t border-stone-100 flex items-center justify-between">
                        <div>
                          <div class="text-xs font-black text-stone-900">₹${p.price}</div>
                          ${p.original_price && p.original_price > p.price ? `
                            <div class="text-[9px] text-stone-400 line-through">₹${p.original_price}</div>
                          ` : ''}
                        </div>

                        <button class="btn-quick-cart bg-amber-700 hover:bg-amber-800 text-white w-7 h-7 rounded-xl flex items-center justify-center text-xs shadow-xs transition"
                                data-product-id="${p.id}" title="${t('addToCart')}">
                          <i class="fa-solid fa-plus"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
      `;

      // Bind Marketplace Events
      const searchInput = document.getElementById("marketplace-search-input");
      if (searchInput) {
        searchInput.addEventListener("input", (e) => {
          searchQuery = e.target.value;
          renderView();
        });
      }

      document.getElementById("btn-clear-search")?.addEventListener("click", () => {
        searchQuery = "";
        renderView();
      });

      document.getElementById("btn-reset-filters")?.addEventListener("click", () => {
        selectedCategory = "all";
        searchQuery = "";
        renderView();
      });

      // Category filter buttons
      container.querySelectorAll(".category-pill").forEach(pill => {
        pill.addEventListener("click", () => {
          selectedCategory = pill.getAttribute("data-cat");
          renderView();
        });
      });

      // Filter by seller buttons
      container.querySelectorAll(".btn-filter-seller").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const sellerId = btn.getAttribute("data-seller-id");
          const sellerProds = await api.getProducts({ seller_id: sellerId });
          allProducts = sellerProds.products || [];
          renderView();
        });
      });

      // Open product details
      container.querySelectorAll(".product-card").forEach(card => {
        card.addEventListener("click", (e) => {
          if (e.target.closest(".btn-quick-cart")) return;
          const pid = card.getAttribute("data-product-id");
          window.app.navigate("buyer_product_details", { productId: pid });
        });
      });

      // Quick add to cart
      container.querySelectorAll(".btn-quick-cart").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const pid = btn.getAttribute("data-product-id");
          if (!api.token) {
            showToast(t("loginRequiredCart"), "info");
            window.app.navigate("auth", { mode: "login" });
            return;
          }
          try {
            await api.addToCart(parseInt(pid), 1);
            showToast("Added to cart! 🛍️", "success");
            window.app.updateCartBadge();
          } catch (err) {
            showToast(err.message, "error");
          }
        });
      });
    }

    renderView();

  } catch (err) {
    if (err.message && err.message.toLowerCase().includes("authentication")) {
      api.clearAuth();
      renderBuyerMarketplace(container);
      return;
    }
    container.innerHTML = `
      <div class="p-6 text-center text-rose-600">
        <p class="text-xs font-bold">Failed to load marketplace: ${err.message}</p>
      </div>
    `;
  }
}
