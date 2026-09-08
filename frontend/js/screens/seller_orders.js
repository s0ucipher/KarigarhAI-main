// Seller / Artisan Order Management Screen

async function renderSellerOrders(container) {
  if (!api.token || (api.user && api.user.role !== "seller")) {
    container.innerHTML = `
      <div class="p-4 space-y-4 max-w-lg mx-auto pb-24">
        <div class="flex items-center justify-between">
          <h1 class="text-base font-black text-stone-900 tracking-tight flex items-center gap-2">
            <i class="fa-solid fa-boxes-packing text-amber-700"></i> ${t("navOrders")}
          </h1>
          <button id="btn-orders-market" class="text-xs font-bold text-amber-800 hover:underline">
            ${t("navMarketplace")}
          </button>
        </div>

        <div class="bg-white border border-stone-200 rounded-3xl p-8 text-center text-stone-500">
          <div class="w-14 h-14 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
            <i class="fa-solid fa-boxes-packing"></i>
          </div>
          <h3 class="text-sm font-bold text-stone-800">Artisan Order Management</h3>
          <p class="text-xs text-stone-400 mt-1 max-w-xs mx-auto">
            Please log in with an artisan account to view and fulfill your craft orders.
          </p>
          <div class="mt-5 flex items-center justify-center gap-2">
            <button id="btn-seller-login" class="bg-amber-700 hover:bg-amber-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow transition flex items-center gap-1.5">
              <i class="fa-solid fa-arrow-right-to-bracket text-[11px]"></i> ${t("login")} as Artisan
            </button>
            <button id="btn-orders-explore" class="bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-2.5 px-4 rounded-xl text-xs transition">
              ${t("navMarketplace")}
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById("btn-seller-login")?.addEventListener("click", () => {
      window.app.navigate("auth", { mode: "login" });
    });
    document.getElementById("btn-orders-market")?.addEventListener("click", () => {
      window.app.navigate("buyer_marketplace");
    });
    document.getElementById("btn-orders-explore")?.addEventListener("click", () => {
      window.app.navigate("buyer_marketplace");
    });
    return;
  }

  container.innerHTML = `
    <div class="p-6 text-center text-stone-500">
      <i class="fa-solid fa-spinner fa-spin text-3xl text-amber-700"></i>
      <p class="text-xs mt-2 font-medium">Loading orders to fulfill...</p>
    </div>
  `;

  try {
    const res = await api.getSellerOrders();
    const orders = res.orders || [];

    let currentFilter = "all"; // 'all', 'active', 'delivered'

    function renderList() {
      const filtered = orders.filter(o => {
        if (currentFilter === "active") return o.status !== "delivered" && o.status !== "cancelled";
        if (currentFilter === "delivered") return o.status === "delivered";
        return true;
      });

      container.innerHTML = `
        <div class="p-4 space-y-4 max-w-lg mx-auto pb-24">
          <!-- Screen Header -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <button id="btn-back-dash" class="text-stone-600 hover:text-stone-900 p-1.5 rounded-lg hover:bg-stone-100 text-xs">
                <i class="fa-solid fa-arrow-left"></i>
              </button>
              <h1 class="text-base font-black text-stone-900 tracking-tight flex items-center gap-2">
                <i class="fa-solid fa-boxes-packing text-amber-700"></i> ${t("navOrders")}
              </h1>
            </div>

            <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900">
              ${orders.length} total
            </span>
          </div>

          <!-- Order Status Filter Tabs -->
          <div class="flex p-1 bg-stone-100 rounded-xl text-xs font-semibold">
            <button class="filter-tab flex-1 py-1.5 text-center rounded-lg transition ${currentFilter === 'all' ? 'bg-white text-amber-800 shadow-xs font-bold' : 'text-stone-500'}" data-filter="all">
              All (${orders.length})
            </button>
            <button class="filter-tab flex-1 py-1.5 text-center rounded-lg transition ${currentFilter === 'active' ? 'bg-white text-amber-800 shadow-xs font-bold' : 'text-stone-500'}" data-filter="active">
              To Ship (${orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length})
            </button>
            <button class="filter-tab flex-1 py-1.5 text-center rounded-lg transition ${currentFilter === 'delivered' ? 'bg-white text-amber-800 shadow-xs font-bold' : 'text-stone-500'}" data-filter="delivered">
              Delivered (${orders.filter(o => o.status === 'delivered').length})
            </button>
          </div>

          <!-- Orders List -->
          ${filtered.length === 0 ? `
            <div class="bg-white border border-stone-200 rounded-2xl p-8 text-center text-stone-500">
              <div class="w-12 h-12 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto mb-2 text-xl">
                <i class="fa-solid fa-clipboard-check"></i>
              </div>
              <p class="text-xs font-bold text-stone-800">${t("noOrdersYet")}</p>
              <p class="text-[11px] text-stone-400 mt-0.5">When buyers purchase your handmade crafts, orders will appear here.</p>
            </div>
          ` : `
            <div class="space-y-4">
              ${filtered.map(o => {
                const addr = o.delivery_address || {};
                const isDelivered = o.status === "delivered";

                return `
                  <div class="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3">
                    <!-- Order Header -->
                    <div class="flex items-start justify-between">
                      <div>
                        <div class="flex items-center gap-2">
                          <span class="text-xs font-black text-stone-900">${o.order_number}</span>
                          <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeClass(o.status)}">
                            ${t('orderStatus_' + o.status, o.status)}
                          </span>
                        </div>
                        <p class="text-[11px] text-stone-400 mt-0.5">Placed on ${new Date(o.created_at).toLocaleDateString()}</p>
                      </div>

                      <div class="text-right">
                        <div class="text-xs font-black text-stone-900">₹${o.total_amount}</div>
                        <span class="text-[10px] text-stone-500">${o.payment_method}</span>
                      </div>
                    </div>

                    <!-- Items ordered -->
                    <div class="bg-stone-50 rounded-xl p-2.5 space-y-2">
                      ${(o.items || []).map(item => `
                        <div class="flex items-center gap-2.5">
                          <img src="${item.product_image || '/static/images/products/terracotta_vase.jpg'}" 
                               class="w-10 h-10 rounded-lg object-cover border border-stone-200">
                          <div class="flex-1 min-w-0">
                            <h4 class="text-xs font-bold text-stone-900 truncate">${item.product_name}</h4>
                            <p class="text-[11px] text-stone-500">Qty: <b>${item.quantity}</b> × ₹${item.unit_price}</p>
                          </div>
                        </div>
                      `).join('')}
                    </div>

                    <!-- Buyer Shipping Info -->
                    <div class="border-t border-stone-100 pt-2 text-xs text-stone-700">
                      <div class="flex items-center justify-between mb-1">
                        <span class="text-[11px] font-bold text-stone-500 uppercase tracking-wider">${t("buyerInfo")}</span>
                        ${addr.phone ? `
                          <a href="tel:${addr.phone}" class="text-amber-800 text-[11px] font-bold flex items-center gap-1 hover:underline">
                            <i class="fa-solid fa-phone"></i> Call Buyer
                          </a>
                        ` : ''}
                      </div>
                      <p class="font-bold text-stone-900">${addr.full_name || o.buyer_name || 'Valued Customer'}</p>
                      <p class="text-stone-500 text-[11px] leading-tight">
                        ${addr.street ? `${addr.street}, ` : ''}${addr.city || ''} ${addr.state ? `, ${addr.state}` : ''} ${addr.pincode ? `- ${addr.pincode}` : ''}
                      </p>
                    </div>

                    <!-- Order Status Progression Action Button -->
                    ${!isDelivered ? `
                      <div class="border-t border-stone-100 pt-2 flex gap-2">
                        ${getNextStatusActionBtn(o)}
                      </div>
                    ` : `
                      <div class="bg-emerald-50 rounded-xl p-2 text-center text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                        <i class="fa-solid fa-circle-check text-emerald-600"></i> Successfully Delivered
                      </div>
                    `}
                  </div>
                `;
              }).join('')}
            </div>
          `}
        </div>
      `;

      // Filter tabs event
      container.querySelectorAll(".filter-tab").forEach(tab => {
        tab.addEventListener("click", () => {
          currentFilter = tab.getAttribute("data-filter");
          renderList();
        });
      });

      // Back button
      document.getElementById("btn-back-dash")?.addEventListener("click", () => {
        window.app.navigate("seller_dashboard");
      });

      // Status change actions
      container.querySelectorAll(".btn-change-status").forEach(btn => {
        btn.addEventListener("click", async () => {
          const orderId = btn.getAttribute("data-order-id");
          const targetStatus = btn.getAttribute("data-target-status");
          try {
            showToast(`Updating order to '${targetStatus}'...`, "info");
            await api.updateOrderStatus(orderId, targetStatus);
            showToast(`Order status updated!`, "success");
            renderSellerOrders(container);
          } catch (err) {
            showToast(err.message, "error");
          }
        });
      });
    }

    renderList();

  } catch (err) {
    if (err.message && err.message.toLowerCase().includes("authentication")) {
      api.clearAuth();
      renderSellerOrders(container);
      return;
    }
    container.innerHTML = `
      <div class="p-6 text-center text-rose-600">
        <p class="text-xs font-bold">Failed to load orders: ${err.message}</p>
      </div>
    `;
  }
}

function getStatusBadgeClass(status) {
  switch (status) {
    case "order_placed": return "bg-amber-100 text-amber-900 border border-amber-200";
    case "accepted": return "bg-blue-100 text-blue-900 border border-blue-200";
    case "processing": return "bg-purple-100 text-purple-900 border border-purple-200";
    case "shipped": return "bg-indigo-100 text-indigo-900 border border-indigo-200";
    case "out_for_delivery": return "bg-teal-100 text-teal-900 border border-teal-200";
    case "delivered": return "bg-emerald-100 text-emerald-900 border border-emerald-200";
    case "cancelled": return "bg-rose-100 text-rose-900 border border-rose-200";
    default: return "bg-stone-100 text-stone-700";
  }
}

function getNextStatusActionBtn(order) {
  const current = order.status;
  if (current === "order_placed") {
    return `
      <button class="btn-change-status flex-1 bg-amber-700 hover:bg-amber-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5"
              data-order-id="${order.id}" data-target-status="accepted">
        <i class="fa-solid fa-handshake"></i> ${t("btnAcceptOrder")}
      </button>
    `;
  } else if (current === "accepted") {
    return `
      <button class="btn-change-status flex-1 bg-purple-700 hover:bg-purple-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5"
              data-order-id="${order.id}" data-target-status="processing">
        <i class="fa-solid fa-box-open"></i> ${t("btnMarkProcessing")}
      </button>
    `;
  } else if (current === "processing") {
    return `
      <button class="btn-change-status flex-1 bg-indigo-700 hover:bg-indigo-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5"
              data-order-id="${order.id}" data-target-status="shipped">
        <i class="fa-solid fa-truck-fast"></i> ${t("btnMarkShipped")}
      </button>
    `;
  } else if (current === "shipped") {
    return `
      <button class="btn-change-status flex-1 bg-teal-700 hover:bg-teal-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5"
              data-order-id="${order.id}" data-target-status="out_for_delivery">
        <i class="fa-solid fa-motorcycle"></i> Out for Delivery
      </button>
    `;
  } else if (current === "out_for_delivery") {
    return `
      <button class="btn-change-status flex-1 bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-2.5 rounded-xl text-xs shadow-sm flex items-center justify-center gap-1.5"
              data-order-id="${order.id}" data-target-status="delivered">
        <i class="fa-solid fa-circle-check"></i> ${t("btnMarkDelivered")}
      </button>
    `;
  }
  return '';
}
