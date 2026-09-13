async function renderSellerProfile(container) {
  if (!api.token || (api.user && api.user.role !== "seller")) {
    container.innerHTML = `
      <div class="p-4 space-y-4 max-w-lg mx-auto pb-24">
        <div class="flex items-center justify-between">
          <h1 class="text-base font-black text-stone-900 tracking-tight">
            ${t("navProfile")}
          </h1>
          <button id="btn-seller-prof-login" class="text-xs font-bold text-amber-800 hover:text-amber-900 flex items-center gap-1">
            <i class="fa-solid fa-arrow-right-to-bracket"></i> ${t("login")}
          </button>
        </div>

        <div class="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs text-center">
          <div class="w-20 h-20 rounded-full bg-stone-100 border-4 border-stone-200 flex items-center justify-center text-stone-400 text-3xl mx-auto mb-3">
            <i class="fa-solid fa-hammer"></i>
          </div>
          <h2 class="text-base font-black text-stone-900">Artisan Studio Profile</h2>
          <span class="inline-block bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1">
            Artisan Account Required
          </span>
          <p class="text-xs text-stone-500 mt-2 max-w-xs mx-auto">
            Please log in with an artisan account to edit your craftsman bio, specialization, and village location.
          </p>
          <div class="mt-4 flex items-center justify-center gap-2">
            <button id="btn-login-artisan-prof" class="bg-amber-700 hover:bg-amber-800 text-white font-bold py-2.5 px-5 rounded-xl text-xs shadow transition flex items-center gap-1.5">
              <i class="fa-solid fa-arrow-right-to-bracket text-[11px]"></i> ${t("login")} as Artisan
            </button>
          </div>
        </div>

        <div class="bg-white border border-stone-200 rounded-2xl p-2 shadow-xs divide-y divide-stone-100">
          <button id="btn-prof-to-market" class="w-full flex items-center justify-between p-3 hover:bg-stone-50 text-left rounded-xl">
            <div class="flex items-center gap-3">
              <i class="fa-solid fa-store text-amber-700 text-sm"></i>
              <span class="text-xs font-bold text-stone-800">${t("navMarketplace")}</span>
            </div>
            <i class="fa-solid fa-chevron-right text-stone-400 text-xs"></i>
          </button>
        </div>
      </div>
    `;

    document.getElementById("btn-seller-prof-login")?.addEventListener("click", () => {
      window.app.navigate("auth", { mode: "login" });
    });
    document.getElementById("btn-login-artisan-prof")?.addEventListener("click", () => {
      window.app.navigate("auth", { mode: "login" });
    });
    document.getElementById("btn-prof-to-market")?.addEventListener("click", () => {
      window.app.navigate("buyer_marketplace");
    });
    return;
  }

  try {
    const user = await api.getMe();
    const profile = user.seller_profile || {};

    container.innerHTML = `
      <div class="p-4 space-y-4 max-w-lg mx-auto pb-24">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h1 class="text-base font-black text-stone-900 tracking-tight">
            ${t("navProfile")}
          </h1>
          <button id="btn-seller-logout" class="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1">
            <i class="fa-solid fa-arrow-right-from-bracket"></i> ${t("logout")}
          </button>
        </div>

        <!-- Profile Card -->
        <div class="bg-white border border-stone-200 rounded-3xl p-5 shadow-xs text-center relative overflow-hidden">
          <div class="relative w-20 h-20 mx-auto mb-3">
            <img src="${user.avatar_url || '/static/images/avatars/artisan1.png'}" 
                 class="w-20 h-20 rounded-full border-4 border-amber-100 object-cover shadow">
            <div class="absolute bottom-0 right-0 bg-amber-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-[10px] border-2 border-white shadow">
              <i class="fa-solid fa-hammer"></i>
            </div>
          </div>

          <h2 class="text-base font-black text-stone-900">${user.name}</h2>
          <span class="inline-block bg-amber-100 text-amber-900 text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1">
            <i class="fa-solid fa-certificate text-amber-700"></i> ${profile.badge || 'Verified Artisan'}
          </span>
          <p class="text-xs text-amber-800 font-semibold mt-1">${profile.craft_specialization || 'Handmade Crafts'}</p>
          <p class="text-[11px] text-stone-500"><i class="fa-solid fa-location-dot text-amber-700"></i> ${profile.location || 'India'}</p>

          <!-- Artisan Story / Bio -->
          <div class="mt-4 bg-amber-50/60 rounded-2xl p-3 text-left border border-amber-200/60">
            <div class="text-[10px] font-bold uppercase tracking-wider text-amber-900 mb-1 flex items-center gap-1">
              <i class="fa-solid fa-book-open"></i> ${t("craftsmanStory")}
            </div>
            <p class="text-xs text-stone-700 leading-relaxed italic">
              "${profile.story_bio || 'Dedicated to preserving cultural heritage through traditional Indian craftsmanship.'}"
            </p>
          </div>
        </div>

        <!-- Quick Switcher to Buyer Experience -->
        <div class="bg-stone-900 rounded-2xl p-4 text-white flex items-center justify-between shadow-md">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-lg text-emerald-400">
              <i class="fa-solid fa-bag-shopping"></i>
            </div>
            <div>
              <div class="text-xs font-black">Explore as Buyer</div>
              <div class="text-[10px] text-stone-400">See how customers view the marketplace</div>
            </div>
          </div>
          <button id="btn-quick-switch-buyer" class="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-xs transition">
            Switch
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

        <!-- Edit Profile Form -->
        <div class="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
          <h3 class="text-xs font-bold text-stone-800 mb-3 uppercase tracking-wider">Update Craft Details</h3>
          <form id="form-edit-artisan" class="space-y-3">
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Your Full Name</label>
              <input type="text" id="edit-artisan-name" value="${user.name}" class="w-full px-3 py-2 text-xs rounded-xl border border-stone-300">
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Craft Specialization</label>
              <input type="text" id="edit-artisan-craft" value="${profile.craft_specialization || ''}" class="w-full px-3 py-2 text-xs rounded-xl border border-stone-300">
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Location / Village</label>
              <input type="text" id="edit-artisan-loc" value="${profile.location || ''}" class="w-full px-3 py-2 text-xs rounded-xl border border-stone-300">
            </div>
            <div>
              <label class="block text-xs font-semibold text-stone-700 mb-1">Your Story / Tradition</label>
              <textarea id="edit-artisan-bio" rows="3" class="w-full px-3 py-2 text-xs rounded-xl border border-stone-300">${profile.story_bio || ''}</textarea>
            </div>
            <button type="submit" class="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-xs">
              Save Profile Changes
            </button>
          </form>
        </div>
      </div>
    `;

    // Logout
    document.getElementById("btn-seller-logout")?.addEventListener("click", () => {
      api.clearAuth();
      window.app.navigate("auth");
    });

    // Switch to Buyer
    document.getElementById("btn-quick-switch-buyer")?.addEventListener("click", () => {
      window.app.switchUserMode("buyer");
    });

    // Language buttons
    container.querySelectorAll(".lang-select-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const lang = btn.getAttribute("data-lang");
        setLanguage(lang);
        renderSellerProfile(container);
      });
    });

    // Save profile
    document.getElementById("form-edit-artisan")?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("edit-artisan-name").value.trim();
      const craft = document.getElementById("edit-artisan-craft").value.trim();
      const loc = document.getElementById("edit-artisan-loc").value.trim();
      const bio = document.getElementById("edit-artisan-bio").value.trim();

      try {
        await api.updateProfile({
          name,
          craft_specialization: craft,
          location: loc,
          story_bio: bio
        });
        showToast("Profile updated successfully!", "success");
        renderSellerProfile(container);
      } catch (err) {
        showToast(err.message, "error");
      }
    });

  } catch (err) {
    if (err.message && err.message.toLowerCase().includes("authentication")) {
      api.clearAuth();
      renderSellerProfile(container);
      return;
    }
    container.innerHTML = `<div class="p-6 text-center text-rose-600">${err.message}</div>`;
  }
}
