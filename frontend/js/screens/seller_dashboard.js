// Seller / Artisan Dashboard Screen

async function renderSellerDashboard(container) {
  container.innerHTML = `
    <div class="p-6 text-center text-stone-500">
      <i class="fa-solid fa-spinner fa-spin text-3xl text-amber-700"></i>
      <p class="text-xs mt-2 font-medium">Loading your artisan dashboard...</p>
    </div>
  `;

  try {
    const data = await api.getSellerDashboard();
    const stats = data.stats;
    const profile = data.profile;
    const activeOrders = data.active_orders || [];
    const products = data.all_products || [];

    container.innerHTML = `
      <div class="p-4 space-y-5 pb-20">
        <!-- Artisan Greeting Banner -->
        <div class="bg-gradient-to-r from-amber-800 to-amber-900 rounded-2xl p-4 text-white shadow-md relative overflow-hidden">
          <div class="flex items-start justify-between relative z-10">
            <div class="flex items-center gap-3">
              <img src="${api.user.avatar_url || '/static/images/avatars/artisan1.png'}" 
                   class="w-13 h-13 rounded-full border-2 border-amber-300/60 object-cover shadow">
              <div>
                <div class="flex items-center gap-2">
                  <h1 class="text-lg font-bold">${t("helloArtisan")}, ${api.user.name.split(' ')[0]}</h1>
                  <span class="bg-amber-500/30 border border-amber-300/40 text-amber-200 text-[10px] px-2 py-0.5 rounded-full font-bold">
                    <i class="fa-solid fa-certificate text-amber-300"></i> ${profile.badge || 'Artisan'}
                  </span>
                </div>
                <p class="text-xs text-amber-200/90 font-medium">${profile.craft_specialization || 'Handmade Crafts'}</p>
                <p class="text-[11px] text-amber-300/80"><i class="fa-solid fa-location-dot"></i> ${profile.location || 'India'}</p>
              </div>
            </div>

            <!-- Audio Help Button -->
            <button id="btn-audio-help" title="${t('listenInstructions')}" 
                    class="bg-amber-700/80 hover:bg-amber-600 text-amber-100 p-2.5 rounded-xl border border-amber-500/40 shadow transition">
              <i class="fa-solid fa-volume-high text-sm"></i>
            </button>
          </div>

          <!-- Subtle Background Pattern -->
          <div class="absolute -right-6 -bottom-6 opacity-10 text-8xl pointer-events-none">
            <i class="fa-solid fa-hands-holding-circle"></i>
          </div>
        </div>

        <!-- BIG HERO ACTION: Add New Craft -->
        <div>
          <button id="btn-hero-add-craft" 
                  class="w-full bg-gradient-to-r from-orange-600 via-amber-700 to-amber-800 hover:from-orange-700 hover:to-amber-900 text-white font-black text-base py-4 px-5 rounded-2xl shadow-lg border-2 border-amber-400/30 flex items-center justify-between transition transform active:scale-98">
            <div class="flex items-center gap-3.5">
              <div class="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl shadow-inner">
                <i class="fa-solid fa-camera"></i>
              </div>
              <div class="text-left">
                <div class="text-base font-extrabold tracking-wide">${t("btnAddNewCraft")}</div>
                <div class="text-xs text-amber-200 font-normal">AI fixes lighting, photo & writes details</div>
              </div>
            </div>
            <i class="fa-solid fa-chevron-right text-amber-300 text-lg"></i>
          </button>
        </div>

        <!-- Metric Stat Cards -->
        <div class="grid grid-cols-3 gap-2.5">
          <!-- Earnings -->
          <div class="bg-white border border-stone-200 rounded-2xl p-3 shadow-xs text-center">
            <div class="text-amber-700 text-lg mb-0.5">
              <i class="fa-solid fa-indian-rupee-sign"></i>
            </div>
            <div class="text-base font-black text-stone-900">₹${stats.total_earnings.toLocaleString()}</div>
            <div class="text-[10px] text-stone-500 font-bold uppercase tracking-wider mt-0.5">${t("totalEarnings")}</div>
          </div>

          <!-- Orders to Ship -->
          <div class="bg-white border border-stone-200 rounded-2xl p-3 shadow-xs text-center cursor-pointer hover:border-amber-400" id="card-orders">
            <div class="text-emerald-700 text-lg mb-0.5">
              <i class="fa-solid fa-truck-fast"></i>
            </div>
            <div class="text-base font-black text-stone-900 flex items-center justify-center gap-1">
              ${stats.active_orders_count}
              ${stats.active_orders_count > 0 ? `<span class="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>` : ''}
            </div>
            <div class="text-[10px] text-stone-500 font-bold uppercase tracking-wider mt-0.5">${t("activeOrders")}</div>
          </div>

          <!-- Total Crafts Listed -->
          <div class="bg-white border border-stone-200 rounded-2xl p-3 shadow-xs text-center">
            <div class="text-amber-800 text-lg mb-0.5">
              <i class="fa-solid fa-boxes-stacked"></i>
            </div>
            <div class="text-base font-black text-stone-900">${stats.total_products}</div>
            <div class="text-[10px] text-stone-500 font-bold uppercase tracking-wider mt-0.5">${t("totalCrafts")}</div>
          </div>
        </div>

        <!-- Active Orders Alert Banner (if any pending orders) -->
        ${activeOrders.length > 0 ? `
          <div class="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-xs">
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2">
                <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 class="text-xs font-bold text-emerald-900 uppercase tracking-wider">${t("recentOrders")} (${activeOrders.length})</h3>
              </div>
              <button id="btn-view-all-orders" class="text-xs text-emerald-800 font-bold hover:underline">
                View All <i class="fa-solid fa-arrow-right text-[10px]"></i>
              </button>
            </div>

            <div class="space-y-2.5">
              ${activeOrders.slice(0, 2).map(order => `
                <div class="bg-white rounded-xl p-3 border border-emerald-100 shadow-xs flex items-center justify-between">
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-black text-stone-900">${order.order_number}</span>
                      <span class="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800">
                        ${t('orderStatus_' + order.status, order.status)}
                      </span>
                    </div>
                    <p class="text-xs text-stone-600 mt-0.5">Buyer: <b>${order.buyer_name}</b> • ₹${order.total_amount}</p>
                    <p class="text-[11px] text-stone-500"><i class="fa-solid fa-location-dot text-stone-400"></i> ${order.delivery_address?.city || 'India'}, ${order.delivery_address?.state || ''}</p>
                  </div>
                  <button class="btn-ship-order bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold py-2 px-3 rounded-lg shadow-sm" data-order-id="${order.id}">
                    Manage
                  </button>
                </div>
              `).join('')}
            </div>
          </div>
        ` : ''}

        <!-- My Listed Crafts Section -->
        <div>
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-bold text-stone-900 tracking-tight flex items-center gap-2">
              <i class="fa-solid fa-gem text-amber-700"></i> ${t("myListedCrafts")} (${products.length})
            </h2>
            <button id="btn-add-product-small" class="text-xs text-amber-800 font-bold hover:underline flex items-center gap-1">
              <i class="fa-solid fa-plus"></i> Add
            </button>
          </div>

          ${products.length === 0 ? `
            <div class="bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl p-8 text-center">
              <div class="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl">
                <i class="fa-solid fa-wand-magic-sparkles"></i>
              </div>
              <h3 class="text-sm font-bold text-stone-800">No crafts listed yet</h3>
              <p class="text-xs text-stone-500 mt-1 max-w-xs mx-auto">Snap a photo of your handmade pottery, weaving, or painting to list it in 1 minute with AI.</p>
              <button id="btn-empty-add" class="mt-4 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow">
                List Your First Craft
              </button>
            </div>
          ` : `
            <div class="space-y-3">
              ${products.map(p => `
                <div class="bg-white border border-stone-200 rounded-2xl p-3 shadow-xs flex items-center gap-3">
                  <div class="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-stone-100 border border-stone-200">
                    <img src="${p.enhanced_image_url || p.original_image_url}" 
                         alt="${p.name}" class="w-full h-full object-cover">
                    <span class="absolute bottom-1 right-1 text-[9px] font-bold bg-black/70 text-white px-1.5 py-0.5 rounded backdrop-blur-xs">
                      AI Enhanced
                    </span>
                  </div>

                  <div class="flex-1 min-w-0">
                    <div class="flex items-start justify-between gap-1">
                      <h3 class="text-xs font-bold text-stone-900 truncate">${p.name}</h3>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${p.quantity > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">
                        ${p.quantity > 0 ? `${p.quantity} in stock` : t('outOfStock')}
                      </span>
                    </div>
                    <p class="text-[11px] text-amber-900 font-semibold mt-0.5">${p.category_name || 'Handmade'}</p>
                    
                    <div class="flex items-center justify-between mt-2">
                      <div class="text-xs font-extrabold text-stone-900">
                        ₹${p.price}
                        ${p.original_price && p.original_price > p.price ? `<span class="text-[10px] font-normal text-stone-400 line-through">₹${p.original_price}</span>` : ''}
                      </div>

                      <div class="flex items-center gap-1.5">
                        <button class="btn-edit-product text-stone-600 hover:text-amber-800 p-1.5 rounded-lg border border-stone-200 hover:bg-stone-50" data-product-id="${p.id}" title="${t('editProduct')}">
                          <i class="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button class="btn-delete-product text-stone-400 hover:text-rose-700 p-1.5 rounded-lg border border-stone-200 hover:bg-rose-50" data-product-id="${p.id}" title="${t('deleteProduct')}">
                          <i class="fa-solid fa-trash text-xs"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      </div>
    `;

    // Bind Dashboard Events
    const btnHeroAdd = document.getElementById("btn-hero-add-craft");
    const btnSmallAdd = document.getElementById("btn-add-product-small");
    const btnEmptyAdd = document.getElementById("btn-empty-add");
    const btnAudio = document.getElementById("btn-audio-help");
    const cardOrders = document.getElementById("card-orders");
    const btnViewOrders = document.getElementById("btn-view-all-orders");

    const goToAdd = () => window.app.navigate("seller_add_product");
    if (btnHeroAdd) btnHeroAdd.addEventListener("click", goToAdd);
    if (btnSmallAdd) btnSmallAdd.addEventListener("click", goToAdd);
    if (btnEmptyAdd) btnEmptyAdd.addEventListener("click", goToAdd);

    const goToOrders = () => window.app.navigate("seller_orders");
    if (cardOrders) cardOrders.addEventListener("click", goToOrders);
    if (btnViewOrders) btnViewOrders.addEventListener("click", goToOrders);

    if (btnAudio) {
      btnAudio.addEventListener("click", () => {
        let text = "Welcome to your artisan dashboard. Tap the big orange camera button to list a new craft.";
        if (currentLanguage === "hi") {
          text = "कारीगर डैशबोर्ड में आपका स्वागत है। नया हस्तशिल्प जोड़ने के लिए बड़े नारंगी कैमरा बटन को दबाएं।";
        } else if (currentLanguage === "bn") {
          text = "কারিগর ড্যাশবোর্ডে আপনাকে স্বাগত। নতুন হস্তশিল্প তালিকাভুক্ত করতে বড় কমলা ক্যামেরা বোতামটি স্পর্শ করুন।";
        }
        speakText(text);
      });
    }

    // Manage order buttons
    container.querySelectorAll(".btn-ship-order").forEach(btn => {
      btn.addEventListener("click", () => window.app.navigate("seller_orders"));
    });

    // Edit product
    container.querySelectorAll(".btn-edit-product").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const prodId = btn.getAttribute("data-product-id");
        openQuickPriceEdit(prodId, products.find(p => p.id == prodId));
      });
    });

    // Delete product
    container.querySelectorAll(".btn-delete-product").forEach(btn => {
      btn.addEventListener("click", async (e) => {
        const prodId = btn.getAttribute("data-product-id");
        if (confirm("Are you sure you want to remove this craft from the marketplace?")) {
          try {
            await api.deleteProduct(prodId);
            showToast("Product removed", "info");
            renderSellerDashboard(container);
          } catch (err) {
            showToast(err.message, "error");
          }
        }
      });
    });

  } catch (err) {
    container.innerHTML = `
      <div class="p-6 text-center text-rose-600">
        <i class="fa-solid fa-circle-exclamation text-3xl mb-2"></i>
        <p class="text-sm font-bold">Failed to load dashboard</p>
        <p class="text-xs text-stone-500 mt-1">${err.message}</p>
        <button id="btn-retry-dash" class="mt-4 bg-amber-700 text-white text-xs font-bold py-2 px-4 rounded-xl">
          Retry
        </button>
      </div>
    `;
    document.getElementById("btn-retry-dash")?.addEventListener("click", () => renderSellerDashboard(container));
  }
}

function openQuickPriceEdit(productId, product) {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in";
  modal.innerHTML = `
    <div class="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-stone-200">
      <div class="flex items-center justify-between mb-3">
        <h3 class="text-sm font-bold text-stone-900">Edit Price & Stock</h3>
        <button id="modal-close-btn" class="text-stone-400 hover:text-stone-600 text-base">✕</button>
      </div>

      <p class="text-xs text-stone-600 font-semibold mb-4 truncate">${product.name}</p>

      <div class="space-y-3">
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Selling Price (₹)</label>
          <input type="number" id="edit-price" value="${product.price}" class="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 font-bold text-stone-900">
        </div>
        <div>
          <label class="block text-xs font-bold text-stone-700 mb-1">Quantity in Stock</label>
          <input type="number" id="edit-qty" value="${product.quantity}" class="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 font-bold text-stone-900">
        </div>
      </div>

      <div class="mt-5 flex gap-2">
        <button id="modal-cancel-btn" class="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2.5 rounded-xl text-xs">
          Cancel
        </button>
        <button id="modal-save-btn" class="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-bold py-2.5 rounded-xl text-xs shadow">
          Save Changes
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector("#modal-close-btn").onclick = close;
  modal.querySelector("#modal-cancel-btn").onclick = close;
  modal.querySelector("#modal-save-btn").onclick = async () => {
    const newPrice = parseFloat(modal.querySelector("#edit-price").value);
    const newQty = parseInt(modal.querySelector("#edit-qty").value);
    try {
      await api.updateProduct(productId, { price: newPrice, quantity: newQty });
      showToast("Updated successfully", "success");
      close();
      window.app.navigate("seller_dashboard");
    } catch (err) {
      showToast(err.message, "error");
    }
  };
}
