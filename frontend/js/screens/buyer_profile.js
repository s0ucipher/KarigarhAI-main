// Buyer Profile Screen

async function renderBuyerProfile(container) {
  try {
    const user = await api.getMe();
    const buyerProfile = user.buyer_profile || {};

    container.innerHTML = `
      <div class="p-4 space-y-4 max-w-lg mx-auto pb-24">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h1 class="text-base font-black text-stone-900 tracking-tight">
            ${t("navProfile")}
          </h1>
          <button id="btn-buyer-logout" class="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> ${t("logout")}
          </button>
        </div>

        <!-- Profile Card -->
        <div class="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs text-center">
          <img src="${user.avatar_url || '/static/images/avatars/buyer1.png'}" 
               class="w-20 h-20 rounded-full border-4 border-emerald-100 object-cover mx-auto mb-3 shadow">
          <h2 class="text-base font-black text-stone-900">${user.name}</h2>
          <span class="inline-block bg-emerald-100 text-emerald-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1">
            <i class="fa-solid fa-bag-shopping text-emerald-700"></i> Conscious Craft Supporter
          </span>
          <p class="text-xs text-stone-500 mt-1">${user.email}</p>
          <p class="text-xs text-stone-500">${user.phone || '+91 98765 43210'}</p>
        </div>

        <!-- Quick Switcher to Artisan Experience -->
        <div class="bg-amber-900 rounded-2xl p-4 text-white flex items-center justify-between shadow-md">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg text-amber-300">
              <i class="fa-solid fa-hands-holding-circle"></i>
            </div>
            <div>
              <div class="text-xs font-black">Become an Artisan Seller</div>
              <div class="text-[10px] text-amber-200">List and sell handmade crafts with AI</div>
            </div>
          </div>
          <button id="btn-quick-switch-artisan" class="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition">
            Switch
          </button>
        </div>

        <!-- Quick Links -->
        <div class="bg-white border border-stone-200 rounded-2xl p-2 shadow-xs divide-y divide-stone-100">
          <button id="btn-goto-orders" class="w-full flex items-center justify-between p-3 hover:bg-stone-50 text-left rounded-xl">
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-box text-amber-700 text-sm"></i>
              <span class="text-xs font-bold text-stone-800">My Orders & Tracking</span>
            </div>
            <i class="fa-solid fa-chevron-right text-stone-400 text-xs"></i>
          </button>

          <button id="btn-goto-cart" class="w-full flex items-center justify-between p-3 hover:bg-stone-50 text-left rounded-xl">
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-cart-shopping text-emerald-700 text-sm"></i>
              <span class="text-xs font-bold text-stone-800">Shopping Cart</span>
            </div>
            <i class="fa-solid fa-chevron-right text-stone-400 text-xs"></i>
          </button>
        </div>

        <!-- Language Preference Selector -->
        <div class="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <label class="block text-xs font-bold text-stone-800 mb-2 flex items-center gap-1.5">
            <i class="fa-solid fa-language text-amber-700"></i> App Language / भाषा / ভাষা
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button class="lang-select-btn py-2 text-center rounded-xl text-xs font-bold border transition ${currentLanguage === 'en' ? 'bg-amber-700 text-white border-amber-700 shadow-xs' : 'border-stone-200 text-stone-700 hover:bg-stone-50'}" data-lang="en">
              English
            </button>
            <button class="lang-select-btn py-2 text-center rounded-xl text-xs font-bold border transition ${currentLanguage === 'hi' ? 'bg-amber-700 text-white border-amber-700 shadow-xs' : 'border-stone-200 text-stone-700 hover:bg-stone-50'}" data-lang="hi">
              हिन्दी
            </button>
            <button class="lang-select-btn py-2 text-center rounded-xl text-xs font-bold border transition ${currentLanguage === 'bn' ? 'bg-amber-700 text-white border-amber-700 shadow-xs' : 'border-stone-200 text-stone-700 hover:bg-stone-50'}" data-lang="bn">
              বাংলা
            </button>
          </div>
        </div>

        <!-- Edit Profile Details -->
        <div class="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <h3 class="text-xs font-bold text-stone-800 mb-3 uppercase tracking-wider">Saved Details</h3>
          <form id="form-edit-buyer" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Full Name</label>
              <input type="text" id="edit-buyer-name" value="${user.name}" class="w-full px-3 py-2 text-xs rounded-xl border border-stone-300">
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Contact Phone</label>
              <input type="tel" id="edit-buyer-phone" value="${user.phone || ''}" class="w-full px-3 py-2 text-xs rounded-xl border border-stone-300">
            </div>
            <button type="submit" class="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs">
              Save Details
            </button>
          </form>
        </div>
      </div>
    `;

    // Logout
    document.getElementById("btn-buyer-logout")?.addEventListener("click", () => {
      api.clearAuth();
      window.app.navigate("auth");
    });

    // Switch to Artisan
    document.getElementById("btn-quick-switch-artisan")?.addEventListener("click", () => {
      window.app.switchUserMode("seller");
    });

    // Navigation buttons
    document.getElementById("btn-goto-orders")?.addEventListener("click", () => {
      window.app.navigate("buyer_orders");
    });
    document.getElementById("btn-goto-cart")?.addEventListener("click", () => {
      window.app.navigate("buyer_cart_checkout");
    });

    // Language buttons
    container.querySelectorAll(".lang-select-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang");
        setLanguage(lang);
        renderBuyerProfile(container);
      });
    });

    // Save
    document.getElementById("form-edit-buyer")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("edit-buyer-name").value.trim();
      const phone = document.getElementById("edit-buyer-phone").value.trim();
      try {
        await api.updateProfile({ name, phone });
        showToast("Profile details updated", "success");
        renderBuyerProfile(container);
      } catch (err) {
        showToast(err.message, "error");
      }
    });

  } catch (err) {
    container.innerHTML = `<div class="p-6 text-center text-rose-600">${err.message}</div>`;
  }
}
