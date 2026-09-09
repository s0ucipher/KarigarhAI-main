// Main Application Router & Orchestrator for KalaSetu AI

class App {
  constructor() {
    this.currentScreen = "buyer_marketplace";
    this.screenParams = {};
    this.unreadNotifications = 0;
    this.cartCount = 0;

    this.init();
  }

  async init() {
    // Determine initial screen based on login state
    if (!api.token || !api.user) {
      // Default to guest marketplace
      this.currentScreen = "buyer_marketplace";
    } else {
      if (api.user.role === "seller") {
        this.currentScreen = "seller_dashboard";
      } else {
        this.currentScreen = "buyer_marketplace";
      }
    }

    // Listen to language changes
    window.addEventListener("languageChanged", () => {
      this.renderCurrentScreen();
      this.renderNav();
      this.renderTopBar();
    });

    // Listen to auth changes
    window.addEventListener("authChanged", () => {
      this.updateCartBadge();
      this.updateNotificationBadge();
      this.renderTopBar();
      this.renderNav();
    });

    this.renderTopBar();
    this.renderNav();
    this.renderCurrentScreen();

    // Initial badge updates
    if (api.token) {
      this.updateCartBadge();
      this.updateNotificationBadge();
    }

    // Bind Desktop / Mobile view mode preview controls
    this.setupViewModeControls();
  }

  setupViewModeControls() {
    const frame = document.getElementById("phone-frame-wrapper");
    const btnDesktop = document.getElementById("btn-view-desktop");
    const btnMobile = document.getElementById("btn-view-mobile");
    const btnToggle = document.getElementById("btn-toggle-frame");

    const updateSelectorUI = (isSimulator) => {
      if (btnDesktop && btnMobile) {
        if (isSimulator) {
          btnMobile.className = "px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 bg-amber-700 text-white shadow-xs";
          btnDesktop.className = "px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 text-stone-300 hover:text-white";
        } else {
          btnDesktop.className = "px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 bg-amber-700 text-white shadow-xs";
          btnMobile.className = "px-3 py-1 rounded-md font-bold transition flex items-center gap-1.5 text-stone-300 hover:text-white";
        }
      }
    };

    btnDesktop?.addEventListener("click", () => {
      if (frame) {
        frame.classList.remove("is-simulator");
        updateSelectorUI(false);
      }
    });

    btnMobile?.addEventListener("click", () => {
      if (frame) {
        frame.classList.add("is-simulator");
        updateSelectorUI(true);
      }
    });

    btnToggle?.addEventListener("click", () => {
      if (frame) {
        const isSim = frame.classList.toggle("is-simulator");
        updateSelectorUI(isSim);
      }
    });
  }

  navigate(screenName, params = {}) {
    if (this.currentScreen !== screenName && this.currentScreen !== "auth") {
      this.previousScreen = this.currentScreen;
      this.previousParams = this.screenParams;
    }
    this.currentScreen = screenName;
    this.screenParams = params;
    window.scrollTo({ top: 0, behavior: "smooth" });
    this.renderTopBar();
    this.renderNav();
    this.renderCurrentScreen();
  }

  goBack() {
    if (this.previousScreen && this.previousScreen !== "auth") {
      const prev = this.previousScreen;
      const prevParams = this.previousParams || {};
      this.previousScreen = null;
      this.previousParams = null;
      this.navigate(prev, prevParams);
    } else if (window.history && window.history.length > 1) {
      window.history.back();
    } else {
      this.navigate("buyer_marketplace");
    }
  }

  async switchUserMode(targetRole) {
    // Switching roles must never sign in as a hard-coded account. The user
    // can sign out from their profile and then authenticate with the desired
    // account; guest browsing remains available from the marketplace.
    showToast(t("switchAccount"), "info");
    this.navigate(targetRole === "seller" ? "auth" : "buyer_marketplace", targetRole === "seller" ? { mode: "login" } : {});
  }

  renderTopBar() {
    const topBar = document.getElementById("app-topbar");
    if (!topBar) return;

    const user = api.user;
    const isSeller = user && user.role === "seller";

    topBar.innerHTML = `
      <div class="bg-white/90 backdrop-blur-md border-b border-stone-200">
        <div class="max-w-7xl mx-auto flex items-center justify-between px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3">
          <!-- Logo & Title -->
          <div class="flex items-center gap-2 cursor-pointer shrink-0" id="brand-logo-click">
            <div class="w-8 h-8 rounded-xl bg-amber-700 text-white flex items-center justify-center text-base shadow-sm">
              <i class="fa-solid fa-hands-holding-circle"></i>
            </div>
            <div>
              <span class="text-sm font-black text-stone-900 tracking-tight">${t("appName")}</span>
              <span class="text-[9px] font-bold block -mt-1 text-amber-800">
                ${isSeller ? 'Artisan Studio' : 'Craft Marketplace'}
              </span>
            </div>
          </div>

          <!-- Desktop Navigation Bar (Visible on desktop screens when not in phone simulator) -->
          ${this.currentScreen !== "auth" ? `
            <nav class="hidden md:flex items-center gap-1 lg:gap-2 desktop-nav-links">
              ${isSeller ? `
                <button class="nav-desktop-item px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${this.currentScreen === 'seller_dashboard' ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'}" data-nav="seller_dashboard">
                  <i class="fa-solid fa-chart-pie text-xs"></i>
                  <span>${t("navHome")}</span>
                </button>
                <button class="nav-desktop-item px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${this.currentScreen === 'seller_orders' ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'}" data-nav="seller_orders">
                  <i class="fa-solid fa-boxes-packing text-xs"></i>
                  <span>${t("navOrders")}</span>
                </button>
                <button class="nav-desktop-item px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${this.currentScreen === 'seller_add_product' ? 'bg-amber-700 text-white shadow-xs' : 'text-amber-800 bg-amber-50 hover:bg-amber-100'}" data-nav="seller_add_product">
                  <i class="fa-solid fa-camera text-xs"></i>
                  <span>${t("navAddProduct")}</span>
                </button>
                <button class="nav-desktop-item px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${this.currentScreen === 'seller_profile' ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'}" data-nav="seller_profile">
                  <i class="fa-solid fa-user-gear text-xs"></i>
                  <span>${t("navProfile")}</span>
                </button>
              ` : `
                <button class="nav-desktop-item px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${this.currentScreen === 'buyer_marketplace' ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'}" data-nav="buyer_marketplace">
                  <i class="fa-solid fa-store text-xs"></i>
                  <span>${t("navMarketplace")}</span>
                </button>
                <button class="nav-desktop-item px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${this.currentScreen === 'buyer_orders' ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'}" data-nav="buyer_orders">
                  <i class="fa-solid fa-box text-xs"></i>
                  <span>${t("navOrders")}</span>
                </button>
                <button class="nav-desktop-item relative px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${this.currentScreen === 'buyer_cart_checkout' ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'}" data-nav="buyer_cart_checkout">
                  <div class="relative flex items-center gap-1">
                    <i class="fa-solid fa-cart-shopping text-xs"></i>
                    <span>${t("navCart")}</span>
                    <span id="badge-desktop-cart-count" class="${this.cartCount > 0 ? '' : 'hidden'} px-1.5 py-0.2 rounded-full bg-amber-700 text-white text-[9px] font-black">
                      ${this.cartCount}
                    </span>
                  </div>
                </button>
                <button class="nav-desktop-item px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${this.currentScreen === 'buyer_profile' ? 'bg-amber-100 text-amber-900' : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'}" data-nav="buyer_profile">
                  <i class="fa-solid fa-user text-xs"></i>
                  <span>${t("navProfile")}</span>
                </button>
              `}
            </nav>
          ` : ''}

          <!-- Right Controls: Role Switcher & Notifications & Language -->
          <div class="flex items-center gap-1.5 shrink-0">
            <!-- Role Switcher or Log In button -->
            ${api.token && api.user ? `
              <button id="btn-top-role-toggle" class="px-2.5 py-1 rounded-full text-[10px] font-black border transition shadow-2xs flex items-center gap-1 ${isSeller ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-stone-100 text-stone-800 border-stone-300'}">
                <i class="fa-solid ${isSeller ? 'fa-hammer text-amber-700' : 'fa-bag-shopping text-emerald-700'}"></i>
                <span>${isSeller ? 'Artisan' : 'Buyer'}</span>
                <i class="fa-solid fa-repeat text-[8px] opacity-60"></i>
              </button>
            ` : `
              <button id="btn-top-login" class="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-700 hover:bg-amber-800 text-white transition shadow-2xs flex items-center gap-1">
                <i class="fa-solid fa-arrow-right-to-bracket text-[9px]"></i>
                <span>${t("login")}</span>
              </button>
            `}

            <!-- Language Dropdown -->
            <div class="relative">
              <button id="btn-lang-dropdown" class="w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs font-bold transition">
                ${currentLanguage.toUpperCase()}
              </button>
              <div id="lang-dropdown-menu" class="hidden absolute right-0 mt-1 w-28 bg-white border border-stone-200 rounded-xl shadow-xl z-50 py-1 text-xs font-bold">
                <button class="lang-opt w-full text-left px-3 py-1.5 hover:bg-amber-50 ${currentLanguage === 'en' ? 'text-amber-800 font-black' : 'text-stone-700'}" data-lang="en">English</button>
                <button class="lang-opt w-full text-left px-3 py-1.5 hover:bg-amber-50 ${currentLanguage === 'hi' ? 'text-amber-800 font-black' : 'text-stone-700'}" data-lang="hi">हिन्दी</button>
                <button class="lang-opt w-full text-left px-3 py-1.5 hover:bg-amber-50 ${currentLanguage === 'bn' ? 'text-amber-800 font-black' : 'text-stone-700'}" data-lang="bn">বাংলা</button>
              </div>
            </div>

            <!-- Notification Bell -->
            <button id="btn-notifications-open" class="relative w-8 h-8 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 flex items-center justify-center text-xs transition">
              <i class="fa-solid fa-bell"></i>
              <span id="badge-notification-count" class="${this.unreadNotifications > 0 ? '' : 'hidden'} absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-black flex items-center justify-center shadow">
                ${this.unreadNotifications}
              </span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Bind desktop nav links
    topBar.querySelectorAll(".nav-desktop-item").forEach(item => {
      item.addEventListener("click", () => {
        const dest = item.getAttribute("data-nav");
        if (dest) this.navigate(dest);
      });
    });

    // Brand click
    document.getElementById("brand-logo-click")?.addEventListener("click", () => {
      if (isSeller) this.navigate("seller_dashboard");
      else this.navigate("buyer_marketplace");
    });

    // Role toggle or Login
    document.getElementById("btn-top-role-toggle")?.addEventListener("click", () => {
      this.switchUserMode(isSeller ? "buyer" : "seller");
    });
    document.getElementById("btn-top-login")?.addEventListener("click", () => {
      this.navigate("auth", { mode: "login" });
    });

    // Language dropdown toggle
    const langBtn = document.getElementById("btn-lang-dropdown");
    const langMenu = document.getElementById("lang-dropdown-menu");
    if (langBtn && langMenu) {
      langBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        langMenu.classList.toggle("hidden");
      });
      document.addEventListener("click", () => langMenu.classList.add("hidden"));
      langMenu.querySelectorAll(".lang-opt").forEach(opt => {
        opt.addEventListener("click", () => {
          setLanguage(opt.getAttribute("data-lang"));
        });
      });
    }

    // Notifications modal open
    document.getElementById("btn-notifications-open")?.addEventListener("click", () => {
      this.openNotificationsModal();
    });
  }

  renderNav() {
    const navBar = document.getElementById("app-bottom-nav");
    if (!navBar) return;

    if (this.currentScreen === "auth") {
      navBar.classList.add("hidden");
      return;
    }
    navBar.classList.remove("hidden");

    const user = api.user;
    const isSeller = user && user.role === "seller";

    if (isSeller) {
      navBar.innerHTML = `
        <div class="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-2 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg">
          <!-- Home / Dashboard -->
          <button class="nav-item flex flex-col items-center justify-center text-center transition ${this.currentScreen === 'seller_dashboard' ? 'text-amber-800 font-bold' : 'text-stone-400 hover:text-stone-600'}" data-nav="seller_dashboard">
            <i class="fa-solid fa-chart-pie text-base mb-0.5"></i>
            <span class="text-[10px]">${t("navHome")}</span>
          </button>

          <!-- Orders -->
          <button class="nav-item flex flex-col items-center justify-center text-center transition ${this.currentScreen === 'seller_orders' ? 'text-amber-800 font-bold' : 'text-stone-400 hover:text-stone-600'}" data-nav="seller_orders">
            <i class="fa-solid fa-boxes-packing text-base mb-0.5"></i>
            <span class="text-[10px]">${t("navOrders")}</span>
          </button>

          <!-- Add Craft (Prominent Action) -->
          <button class="nav-item flex flex-col items-center justify-center text-center -mt-4" data-nav="seller_add_product">
            <div class="w-12 h-12 rounded-full bg-gradient-to-r from-orange-600 to-amber-700 text-white flex items-center justify-center text-xl shadow-lg border-2 border-white">
              <i class="fa-solid fa-camera"></i>
            </div>
            <span class="text-[9px] font-black text-amber-900 mt-0.5">${t("navAddProduct")}</span>
          </button>

          <!-- Profile -->
          <button class="nav-item flex flex-col items-center justify-center text-center transition ${this.currentScreen === 'seller_profile' ? 'text-amber-800 font-bold' : 'text-stone-400 hover:text-stone-600'}" data-nav="seller_profile">
            <i class="fa-solid fa-user-gear text-base mb-0.5"></i>
            <span class="text-[10px]">${t("navProfile")}</span>
          </button>
        </div>
      `;
    } else {
      // Buyer Navigation
      navBar.innerHTML = `
        <div class="max-w-md mx-auto grid grid-cols-4 items-center h-16 px-2 bg-white/95 backdrop-blur-md border-t border-stone-200 shadow-lg">
          <!-- Marketplace -->
          <button class="nav-item flex flex-col items-center justify-center text-center transition ${this.currentScreen === 'buyer_marketplace' ? 'text-amber-800 font-bold' : 'text-stone-400 hover:text-stone-600'}" data-nav="buyer_marketplace">
            <i class="fa-solid fa-store text-base mb-0.5"></i>
            <span class="text-[10px]">${t("navMarketplace")}</span>
          </button>

          <!-- My Orders -->
          <button class="nav-item flex flex-col items-center justify-center text-center transition ${this.currentScreen === 'buyer_orders' ? 'text-amber-800 font-bold' : 'text-stone-400 hover:text-stone-600'}" data-nav="buyer_orders">
            <i class="fa-solid fa-box text-base mb-0.5"></i>
            <span class="text-[10px]">${t("navOrders")}</span>
          </button>

          <!-- Cart -->
          <button class="nav-item relative flex flex-col items-center justify-center text-center transition ${this.currentScreen === 'buyer_cart_checkout' ? 'text-amber-800 font-bold' : 'text-stone-400 hover:text-stone-600'}" data-nav="buyer_cart_checkout">
            <div class="relative">
              <i class="fa-solid fa-cart-shopping text-base mb-0.5"></i>
              <span id="badge-cart-count" class="${this.cartCount > 0 ? '' : 'hidden'} absolute -top-1 -right-2.5 w-4 h-4 rounded-full bg-amber-700 text-white text-[9px] font-black flex items-center justify-center shadow">
                ${this.cartCount}
              </span>
            </div>
            <span class="text-[10px]">${t("navCart")}</span>
          </button>

          <!-- Profile -->
          <button class="nav-item flex flex-col items-center justify-center text-center transition ${this.currentScreen === 'buyer_profile' ? 'text-amber-800 font-bold' : 'text-stone-400 hover:text-stone-600'}" data-nav="buyer_profile">
            <i class="fa-solid fa-user text-base mb-0.5"></i>
            <span class="text-[10px]">${t("navProfile")}</span>
          </button>
        </div>
      `;
    }

    // Bind nav buttons
    navBar.querySelectorAll(".nav-item").forEach(item => {
      item.addEventListener("click", () => {
        const dest = item.getAttribute("data-nav");
        if (dest) this.navigate(dest);
      });
    });
  }

  renderCurrentScreen() {
    const container = document.getElementById("screen-container");
    if (!container) return;

    switch (this.currentScreen) {
      case "auth":
        renderAuthScreen(container, this.screenParams.mode || "login");
        break;
      case "seller_dashboard":
        renderSellerDashboard(container);
        break;
      case "seller_add_product":
        renderSellerAddProduct(container);
        break;
      case "seller_orders":
        renderSellerOrders(container);
        break;
      case "seller_profile":
        renderSellerProfile(container);
        break;
      case "buyer_marketplace":
        renderBuyerMarketplace(container);
        break;
      case "buyer_product_details":
        renderBuyerProductDetails(container, this.screenParams);
        break;
      case "buyer_cart_checkout":
        renderBuyerCartCheckout(container, this.screenParams);
        break;
      case "buyer_orders":
        renderBuyerOrders(container);
        break;
      case "buyer_profile":
        renderBuyerProfile(container);
        break;
      default:
        renderBuyerMarketplace(container);
    }
  }

  async updateCartBadge() {
    if (!api.token || (api.user && api.user.role === "seller")) {
      this.cartCount = 0;
      const el = document.getElementById("badge-cart-count");
      const elD = document.getElementById("badge-desktop-cart-count");
      if (el) el.classList.add("hidden");
      if (elD) elD.classList.add("hidden");
      return;
    }
    try {
      const data = await api.getCart();
      this.cartCount = data.item_count || 0;
      const el = document.getElementById("badge-cart-count");
      const elD = document.getElementById("badge-desktop-cart-count");
      if (el) {
        el.innerText = this.cartCount;
        el.classList.toggle("hidden", this.cartCount === 0);
      }
      if (elD) {
        elD.innerText = this.cartCount;
        elD.classList.toggle("hidden", this.cartCount === 0);
      }
    } catch (e) {
      // ignore
    }
  }

  async updateNotificationBadge() {
    if (!api.token) {
      this.unreadNotifications = 0;
      return;
    }
    try {
      const res = await api.getNotifications();
      this.unreadNotifications = res.unread_count || 0;
      const el = document.getElementById("badge-notification-count");
      if (el) {
        el.innerText = this.unreadNotifications;
        el.classList.toggle("hidden", this.unreadNotifications === 0);
      }
    } catch (e) {
      // ignore
    }
  }

  async openNotificationsModal() {
    if (!api.token) {
      showToast(t("loginRequiredNotifications"), "info");
      this.navigate("auth", { mode: "login" });
      return;
    }
    try {
      const res = await api.getNotifications();
      const notifs = res.notifications || [];

      const modal = document.createElement("div");
      modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-fade-in";
      modal.innerHTML = `
        <div class="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl border border-stone-200 flex flex-col max-h-[80vh]">
          <div class="flex items-center justify-between pb-3 border-b border-stone-100">
            <div class="flex items-center gap-2">
              <i class="fa-solid fa-bell text-amber-700"></i>
              <h3 class="text-sm font-black text-stone-900">Notifications</h3>
            </div>
            <button id="notif-modal-close" class="text-stone-400 hover:text-stone-600 text-sm">✕</button>
          </div>

          <div class="overflow-y-auto flex-1 py-2 divide-y divide-stone-100">
            ${notifs.length === 0 ? `
              <p class="text-xs text-stone-400 py-6 text-center">No notifications yet.</p>
            ` : notifs.map(n => `
              <div class="py-2.5 ${n.is_read ? 'opacity-70' : 'bg-amber-50/40'} rounded-lg px-2">
                <div class="flex items-center justify-between">
                  <h4 class="text-xs font-bold text-stone-900">${n.title}</h4>
                  <span class="text-[9px] text-stone-400">${new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p class="text-[11px] text-stone-600 mt-0.5 leading-snug">${n.message}</p>
              </div>
            `).join('')}
          </div>

          <div class="pt-3 border-t border-stone-100 flex gap-2">
            <button id="notif-mark-all" class="w-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2 rounded-xl text-xs">
              Mark all as read
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector("#notif-modal-close").onclick = () => modal.remove();
      modal.querySelector("#notif-mark-all").onclick = async () => {
        await api.markAllNotificationsRead();
        this.unreadNotifications = 0;
        this.updateNotificationBadge();
        modal.remove();
        showToast("All marked as read", "info");
      };
    } catch (err) {
      showToast(err.message, "error");
    }
  }
}

// Global Toast Manager
function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  const bg = type === "success" ? "bg-emerald-800 text-white" :
             type === "error" ? "bg-rose-800 text-white" :
             "bg-stone-900 text-white";

  const icon = type === "success" ? "fa-circle-check" :
               type === "error" ? "fa-circle-exclamation" :
               "fa-circle-info";

  toast.className = `${bg} px-4 py-2.5 rounded-2xl shadow-xl text-xs font-bold flex items-center gap-2.5 transition-all transform duration-300 translate-y-4 opacity-0 pointer-events-auto max-w-xs`;
  toast.innerHTML = `
    <i class="fa-solid ${icon} text-sm"></i>
    <span class="leading-tight flex-1">${message}</span>
  `;

  container.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove("translate-y-4", "opacity-0");
  });

  setTimeout(() => {
    toast.classList.add("opacity-0", "translate-y-2");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// Instantiate and attach to window
window.addEventListener("DOMContentLoaded", () => {
  window.app = new App();
});
