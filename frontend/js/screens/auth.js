// Authentication Screen (Login, Registration, Role Selection, Password Reset)

function renderAuthScreen(container, mode = "login") {
  let activeTab = mode; // 'login', 'register', 'reset'
  let selectedRole = "seller"; // default for register

  function update() {
    container.innerHTML = `
      <div class="min-h-full flex flex-col justify-center px-4 py-8 max-w-md mx-auto">
        <!-- Brand Header -->
        <div class="text-center mb-6">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-700 text-amber-50 shadow-lg mb-3">
            <i class="fa-solid fa-hands-holding-circle text-3xl"></i>
          </div>
          <h1 class="text-2xl font-bold text-stone-900 tracking-tight">${t("appName")}</h1>
          <p class="text-xs text-amber-800 font-medium mt-1">${t("appTagline")}</p>
        </div>

        <!-- Quick Demo Switcher Card -->
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 shadow-sm">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
              <i class="fa-solid fa-bolt text-amber-600"></i> ${t("guestDemo")}
            </span>
            <span class="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">1-Click Test</span>
          </div>
          <div class="grid grid-cols-2 gap-2">
            <button id="btn-demo-seller" class="flex items-center justify-center gap-1.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-semibold py-2 px-2.5 rounded-lg shadow-sm transition">
              <i class="fa-solid fa-hammer text-amber-200"></i> Ramesh (Artisan)
            </button>
            <button id="btn-demo-buyer" class="flex items-center justify-center gap-1.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-semibold py-2 px-2.5 rounded-lg shadow-sm transition">
              <i class="fa-solid fa-bag-shopping text-emerald-300"></i> Priya (Buyer)
            </button>
          </div>
        </div>

        <!-- Auth Form Card -->
        <div class="bg-white rounded-2xl shadow-sm border border-stone-200 p-6">
          <!-- Mode Tabs -->
          ${activeTab !== 'reset' ? `
            <div class="flex border-b border-stone-100 mb-5">
              <button id="tab-login" class="flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition ${activeTab === 'login' ? 'border-amber-700 text-amber-800' : 'border-transparent text-stone-400 hover:text-stone-600'}">
                ${t("login")}
              </button>
              <button id="tab-register" class="flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition ${activeTab === 'register' ? 'border-amber-700 text-amber-800' : 'border-transparent text-stone-400 hover:text-stone-600'}">
                ${t("signup")}
              </button>
            </div>
          ` : `
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-base font-bold text-stone-800">${t("resetPassword")}</h2>
              <button id="btn-back-login" class="text-xs text-amber-700 font-semibold hover:underline">
                <i class="fa-solid fa-arrow-left"></i> ${t("login")}
              </button>
            </div>
          `}

          <!-- LOGIN FORM -->
          ${activeTab === 'login' ? `
            <form id="form-login" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">${t("email")}</label>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <i class="fa-solid fa-envelope text-sm"></i>
                  </span>
                  <input type="email" id="login-email" required placeholder="artisan@example.com"
                    class="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent">
                </div>
              </div>

              <div>
                <div class="flex justify-between items-center mb-1">
                  <label class="block text-xs font-semibold text-stone-700">${t("password")}</label>
                  <button type="button" id="link-forgot-pwd" class="text-[11px] text-amber-700 hover:underline font-medium">
                    ${t("forgotPassword")}
                  </button>
                </div>
                <div class="relative">
                  <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-stone-400">
                    <i class="fa-solid fa-lock text-sm"></i>
                  </span>
                  <input type="password" id="login-password" required placeholder="••••••••"
                    class="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent">
                </div>
              </div>

              <button type="submit" class="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 rounded-xl shadow-md transition flex items-center justify-center gap-2">
                <span>${t("login")}</span>
                <i class="fa-solid fa-arrow-right text-xs"></i>
              </button>
            </form>
          ` : ''}

          <!-- REGISTER FORM -->
          ${activeTab === 'register' ? `
            <form id="form-register" class="space-y-3.5">
              <!-- Role Selection -->
              <div>
                <label class="block text-xs font-bold text-stone-800 mb-1.5">${t("role")}</label>
                <div class="grid grid-cols-2 gap-2">
                  <button type="button" id="role-seller-btn"
                    class="p-2.5 text-left rounded-xl border-2 transition ${selectedRole === 'seller' ? 'border-amber-700 bg-amber-50/70 text-amber-900 shadow-sm' : 'border-stone-200 bg-stone-50 text-stone-600'}">
                    <div class="flex items-center gap-2 mb-1">
                      <i class="fa-solid fa-hands-holding-circle text-amber-700 text-base"></i>
                      <span class="font-bold text-xs">Artisan</span>
                    </div>
                    <p class="text-[10px] text-stone-500 leading-tight">Sell handmade crafts with AI help</p>
                  </button>

                  <button type="button" id="role-buyer-btn"
                    class="p-2.5 text-left rounded-xl border-2 transition ${selectedRole === 'buyer' ? 'border-amber-700 bg-amber-50/70 text-amber-900 shadow-sm' : 'border-stone-200 bg-stone-50 text-stone-600'}">
                    <div class="flex items-center gap-2 mb-1">
                      <i class="fa-solid fa-bag-shopping text-emerald-700 text-base"></i>
                      <span class="font-bold text-xs">Customer</span>
                    </div>
                    <p class="text-[10px] text-stone-500 leading-tight">Buy authentic crafts directly</p>
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">${t("fullName")}</label>
                <input type="text" id="reg-name" required placeholder="e.g. Ramesh Kumar"
                  class="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600">
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">${t("email")}</label>
                <input type="email" id="reg-email" required placeholder="name@example.com"
                  class="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600">
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">${t("phone")}</label>
                <input type="tel" id="reg-phone" placeholder="+91 98765 43210"
                  class="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600">
              </div>

              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">${t("password")}</label>
                <input type="password" id="reg-password" required minlength="6" placeholder="At least 6 characters"
                  class="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600">
              </div>

              <!-- Artisan specific fields -->
              ${selectedRole === 'seller' ? `
                <div class="pt-1 border-t border-stone-100 space-y-2">
                  <div>
                    <label class="block text-xs font-semibold text-stone-700 mb-1">${t("craftSpecialization")}</label>
                    <input type="text" id="reg-craft" placeholder="e.g. Terracotta Pottery, Handloom Weaving"
                      class="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600">
                  </div>
                  <div>
                    <label class="block text-xs font-semibold text-stone-700 mb-1">${t("location")}</label>
                    <input type="text" id="reg-location" placeholder="e.g. Bishnupur, West Bengal"
                      class="w-full px-3 py-2 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600">
                  </div>
                </div>
              ` : ''}

              <button type="submit" class="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 rounded-xl shadow-md transition mt-2">
                ${t("signup")}
              </button>
            </form>
          ` : ''}

          <!-- RESET PASSWORD FORM -->
          ${activeTab === 'reset' ? `
            <form id="form-reset" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">${t("email")}</label>
                <input type="email" id="reset-email" required placeholder="your.email@example.com"
                  class="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600">
              </div>
              <div>
                <label class="block text-xs font-semibold text-stone-700 mb-1">${t("newPassword")}</label>
                <input type="password" id="reset-new-password" required minlength="6" placeholder="••••••••"
                  class="w-full px-3 py-2.5 text-sm rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-amber-600">
              </div>
              <button type="submit" class="w-full bg-amber-700 hover:bg-amber-800 text-white font-bold py-2.5 rounded-xl shadow-md transition">
                ${t("resetPassword")}
              </button>
            </form>
          ` : ''}
        </div>
      </div>
    `;

    bindEvents();
  }

  function bindEvents() {
    // Tab switching
    const tabLogin = document.getElementById("tab-login");
    const tabRegister = document.getElementById("tab-register");
    const linkForgot = document.getElementById("link-forgot-pwd");
    const btnBackLogin = document.getElementById("btn-back-login");

    if (tabLogin) tabLogin.addEventListener("click", () => { activeTab = "login"; update(); });
    if (tabRegister) tabRegister.addEventListener("click", () => { activeTab = "register"; update(); });
    if (linkForgot) linkForgot.addEventListener("click", () => { activeTab = "reset"; update(); });
    if (btnBackLogin) btnBackLogin.addEventListener("click", () => { activeTab = "login"; update(); });

    // Role buttons in register
    const roleSellerBtn = document.getElementById("role-seller-btn");
    const roleBuyerBtn = document.getElementById("role-buyer-btn");
    if (roleSellerBtn && roleBuyerBtn) {
      roleSellerBtn.addEventListener("click", () => { selectedRole = "seller"; update(); });
      roleBuyerBtn.addEventListener("click", () => { selectedRole = "buyer"; update(); });
    }

    // Demo logins
    const btnDemoSeller = document.getElementById("btn-demo-seller");
    const btnDemoBuyer = document.getElementById("btn-demo-buyer");
    if (btnDemoSeller) {
      btnDemoSeller.addEventListener("click", async () => {
        try {
          showToast("Logging in as Master Artisan Ramesh...", "info");
          await api.login("ramesh@kalasetu.ai", "artisan123");
          showToast("Logged in as Ramesh (Artisan)", "success");
          window.app.navigate("seller_dashboard");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    }

    if (btnDemoBuyer) {
      btnDemoBuyer.addEventListener("click", async () => {
        try {
          showToast("Logging in as Buyer Priya...", "info");
          await api.login("priya@buyer.in", "artisan123");
          showToast("Logged in as Priya (Buyer)", "success");
          window.app.navigate("buyer_marketplace");
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    }

    // Login Form Submit
    const formLogin = document.getElementById("form-login");
    if (formLogin) {
      formLogin.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("login-email").value.trim();
        const pwd = document.getElementById("login-password").value;
        try {
          const res = await api.login(email, pwd);
          showToast(`Welcome back, ${res.user.name}!`, "success");
          if (res.user.role === "seller") {
            window.app.navigate("seller_dashboard");
          } else {
            window.app.navigate("buyer_marketplace");
          }
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    }

    // Register Form Submit
    const formRegister = document.getElementById("form-register");
    if (formRegister) {
      formRegister.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("reg-name").value.trim();
        const email = document.getElementById("reg-email").value.trim();
        const phone = document.getElementById("reg-phone").value.trim();
        const password = document.getElementById("reg-password").value;
        const craft = document.getElementById("reg-craft")?.value?.trim() || "";
        const location = document.getElementById("reg-location")?.value?.trim() || "";

        try {
          const res = await api.register({
            name, email, phone, password,
            role: selectedRole,
            language: currentLanguage,
            craft_specialization: craft,
            location: location
          });
          showToast(`Account created successfully!`, "success");
          if (res.user.role === "seller") {
            window.app.navigate("seller_dashboard");
          } else {
            window.app.navigate("buyer_marketplace");
          }
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    }

    // Reset Form Submit
    const formReset = document.getElementById("form-reset");
    if (formReset) {
      formReset.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("reset-email").value.trim();
        const newPwd = document.getElementById("reset-new-password").value;
        try {
          await api.resetPassword(email, newPwd);
          showToast("Password updated! Please login with your new password.", "success");
          activeTab = "login";
          update();
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    }
  }

  update();
}
