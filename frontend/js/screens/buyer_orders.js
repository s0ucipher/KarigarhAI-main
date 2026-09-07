// Buyer Orders & Visual Tracking Screen

async function renderBuyerOrders(container) {
  container.innerHTML = `
    <div class="p-6 text-center text-stone-500">
      <i class="fa-solid fa-spinner fa-spin text-3xl text-amber-700"></i>
      <p class="text-xs mt-2 font-medium">Tracking your handmade orders...</p>
    </div>
  `;

  try {
    const res = await api.getBuyerOrders();
    const orders = res.orders || [];

    container.innerHTML = `
      <div class="p-4 space-y-4 max-w-lg mx-auto pb-24">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h1 class="text-base font-black text-stone-900 tracking-tight flex items-center gap-2">
            <i class="fa-solid fa-box text-amber-700"></i> My Orders (${orders.length})
          </h1>
          <button id="btn-shop-more" class="text-xs font-bold text-amber-800 hover:underline">
            Browse Crafts
          </button>
        </div>

        ${orders.length === 0 ? `
          <div class="bg-white border border-stone-200 rounded-3xl p-8 text-center text-stone-500">
            <div class="w-14 h-14 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center text-2xl mx-auto mb-2">
              <i class="fa-solid fa-bag-shopping"></i>
            </div>
            <h3 class="text-xs font-bold text-stone-800">No orders placed yet</h3>
            <p class="text-[11px] text-stone-400 mt-0.5">Your orders and live tracking will appear here.</p>
            <button id="btn-start-shopping" class="mt-4 bg-amber-700 hover:bg-amber-800 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow">
              Discover Artisan Crafts
            </button>
          </div>
        ` : `
          <div class="space-y-4">
            ${orders.map(o => {
              const addr = o.delivery_address || {};
              const currentStepIdx = getOrderStatusStepIndex(o.status);

              return `
                <div class="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3.5">
                  <!-- Order Number & Status Badge -->
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-black text-stone-900">${o.order_number}</span>
                        <span class="text-[10px] font-bold px-2 py-0.5 rounded-full ${getStatusBadgeClass(o.status)}">
                          ${t('orderStatus_' + o.status, o.status)}
                        </span>
                      </div>
                      <p class="text-[10px] text-stone-400 mt-0.5">Placed on ${new Date(o.created_at).toLocaleDateString()}</p>
                    </div>

                    <div class="text-right">
                      <div class="text-xs font-black text-stone-900">₹${o.total_amount}</div>
                      <span class="text-[10px] text-stone-500">${o.payment_method}</span>
                    </div>
                  </div>

                  <!-- Visual Progress Tracker Bar -->
                  <div class="bg-stone-50 rounded-2xl p-3 border border-stone-100">
                    <div class="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-3 flex items-center justify-between">
                      <span>Order Timeline</span>
                      <span class="text-amber-800 font-bold">${t('orderStatus_' + o.status, o.status)}</span>
                    </div>

                    <!-- Steps Timeline -->
                    <div class="relative flex items-center justify-between">
                      <div class="absolute left-2 right-2 top-3 h-0.5 bg-stone-200 -z-0"></div>
                      <div class="absolute left-2 top-3 h-0.5 bg-amber-700 transition-all -z-0" style="width: ${(currentStepIdx / 4) * 94}%"></div>

                      <!-- Step 1: Placed -->
                      <div class="relative z-10 flex flex-col items-center">
                        <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStepIdx >= 0 ? 'bg-amber-700 text-white shadow-xs' : 'bg-stone-200 text-stone-600'}">
                          <i class="fa-solid fa-check text-[9px]"></i>
                        </div>
                        <span class="text-[9px] font-medium text-stone-600 mt-1">Placed</span>
                      </div>

                      <!-- Step 2: Accepted -->
                      <div class="relative z-10 flex flex-col items-center">
                        <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStepIdx >= 1 ? 'bg-amber-700 text-white shadow-xs' : 'bg-stone-200 text-stone-600'}">
                          ${currentStepIdx >= 1 ? '<i class="fa-solid fa-check text-[9px]"></i>' : '2'}
                        </div>
                        <span class="text-[9px] font-medium text-stone-600 mt-1">Accepted</span>
                      </div>

                      <!-- Step 3: Processing -->
                      <div class="relative z-10 flex flex-col items-center">
                        <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStepIdx >= 2 ? 'bg-amber-700 text-white shadow-xs' : 'bg-stone-200 text-stone-600'}">
                          ${currentStepIdx >= 2 ? '<i class="fa-solid fa-check text-[9px]"></i>' : '3'}
                        </div>
                        <span class="text-[9px] font-medium text-stone-600 mt-1">Packing</span>
                      </div>

                      <!-- Step 4: Shipped -->
                      <div class="relative z-10 flex flex-col items-center">
                        <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStepIdx >= 3 ? 'bg-amber-700 text-white shadow-xs' : 'bg-stone-200 text-stone-600'}">
                          ${currentStepIdx >= 3 ? '<i class="fa-solid fa-check text-[9px]"></i>' : '4'}
                        </div>
                        <span class="text-[9px] font-medium text-stone-600 mt-1">Shipped</span>
                      </div>

                      <!-- Step 5: Delivered -->
                      <div class="relative z-10 flex flex-col items-center">
                        <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${currentStepIdx >= 4 ? 'bg-emerald-700 text-white shadow-xs' : 'bg-stone-200 text-stone-600'}">
                          ${currentStepIdx >= 4 ? '<i class="fa-solid fa-check text-[9px]"></i>' : '5'}
                        </div>
                        <span class="text-[9px] font-medium text-stone-600 mt-1">Delivered</span>
                      </div>
                    </div>
                  </div>

                  <!-- Ordered Items -->
                  <div class="space-y-2">
                    ${(o.items || []).map(item => `
                      <div class="flex items-center gap-2.5">
                        <img src="${item.product_image || '/static/images/products/terracotta_vase.jpg'}" 
                             class="w-11 h-11 rounded-xl object-cover border border-stone-200">
                        <div class="flex-1 min-w-0">
                          <h4 class="text-xs font-bold text-stone-900 truncate">${item.product_name}</h4>
                          <p class="text-[10px] text-stone-500">By ${item.seller_name || 'Master Artisan'} (${item.seller_location || 'India'})</p>
                          <div class="text-[11px] font-semibold text-stone-800 mt-0.5">
                            Qty: ${item.quantity} • ₹${item.unit_price} each
                          </div>
                        </div>
                      </div>
                    `).join('')}
                  </div>

                  <!-- Delivery Address -->
                  <div class="border-t border-stone-100 pt-2 text-[11px] text-stone-600">
                    <span class="font-bold text-stone-700">Delivering to:</span>
                    ${addr.full_name}, ${addr.street}, ${addr.city}, ${addr.state} - ${addr.pincode}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `}
      </div>
    `;

    document.getElementById("btn-shop-more")?.addEventListener("click", () => {
      window.app.navigate("buyer_marketplace");
    });
    document.getElementById("btn-start-shopping")?.addEventListener("click", () => {
      window.app.navigate("buyer_marketplace");
    });

  } catch (err) {
    container.innerHTML = `<div class="p-6 text-center text-rose-600">${err.message}</div>`;
  }
}

function getOrderStatusStepIndex(status) {
  switch (status) {
    case "order_placed": return 0;
    case "accepted": return 1;
    case "processing": return 2;
    case "shipped": return 3;
    case "out_for_delivery": return 3.5;
    case "delivered": return 4;
    default: return 0;
  }
}
