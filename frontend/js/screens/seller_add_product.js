// AI-Powered Product Listing Wizard for Artisans

function renderSellerAddProduct(container) {
  let currentStep = 1; // 1: Photo, 2: AI Enhance & Compare, 3: AI Details, 4: Pricing & Stock, 5: Success
  let selectedFile = null;
  let enhancementData = null;
  let aiCatalogData = null;
  let finalPrice = 750;
  let finalQuantity = 5;

  function render() {
    container.innerHTML = `
      <div class="p-4 max-w-lg mx-auto pb-24">
        <!-- Top Wizard Header -->
        <div class="flex items-center justify-between mb-4">
          <button id="btn-wizard-back" class="text-xs font-bold text-stone-600 hover:text-stone-900 flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-stone-100">
            <i class="fa-solid fa-arrow-left"></i> ${currentStep > 1 ? 'Back' : 'Dashboard'}
          </button>
          
          <div class="flex items-center gap-1">
            <span class="text-xs font-bold text-amber-800">Step ${currentStep} of 4</span>
          </div>

          <button id="btn-step-voice" class="text-amber-800 bg-amber-100 hover:bg-amber-200 p-1.5 rounded-lg text-xs" title="${t('listenInstructions')}">
            <i class="fa-solid fa-volume-high"></i>
          </button>
        </div>

        <!-- Progress Tracker Pills -->
        <div class="grid grid-cols-4 gap-1.5 mb-5">
          <div class="h-1.5 rounded-full ${currentStep >= 1 ? 'bg-amber-700' : 'bg-stone-200'}"></div>
          <div class="h-1.5 rounded-full ${currentStep >= 2 ? 'bg-amber-700' : 'bg-stone-200'}"></div>
          <div class="h-1.5 rounded-full ${currentStep >= 3 ? 'bg-amber-700' : 'bg-stone-200'}"></div>
          <div class="h-1.5 rounded-full ${currentStep >= 4 ? 'bg-amber-700' : 'bg-stone-200'}"></div>
        </div>

        <!-- STEP CONTENT WRAPPER -->
        <div id="step-content">
          ${renderStepContent()}
        </div>
      </div>
    `;

    bindStepEvents();
  }

  function renderStepContent() {
    if (currentStep === 1) {
      return `
        <div class="space-y-4 animate-fade-in">
          <div class="text-center">
            <h2 class="text-lg font-black text-stone-900">${t("step1Title")}</h2>
            <p class="text-xs text-stone-500 mt-1 max-w-xs mx-auto">${t("step1Sub")}</p>
          </div>

          <!-- Big Camera & Upload Dropzone -->
          <div class="bg-gradient-to-b from-amber-50 to-stone-50 border-2 border-dashed border-amber-300 rounded-3xl p-6 text-center shadow-xs">
            <input type="file" id="file-input-camera" accept="image/*" capture="environment" class="hidden">
            <input type="file" id="file-input-gallery" accept="image/*" class="hidden">

            <div class="w-18 h-18 bg-amber-700 text-white rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-md">
              <i class="fa-solid fa-camera"></i>
            </div>

            <div class="grid grid-cols-2 gap-3 max-w-xs mx-auto">
              <button id="btn-open-camera" class="bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 px-3 rounded-2xl text-xs shadow flex items-center justify-center gap-2">
                <i class="fa-solid fa-camera-retro"></i>
                <span>${t("btnCapturePhoto")}</span>
              </button>

              <button id="btn-open-gallery" class="bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-bold py-3 px-3 rounded-2xl text-xs shadow-xs flex items-center justify-center gap-2">
                <i class="fa-solid fa-image text-amber-700"></i>
                <span>${t("btnUploadPhoto")}</span>
              </button>
            </div>

            <p class="text-[11px] text-stone-400 mt-4">JPG, PNG, WebP up to 20MB</p>
          </div>

          <!-- Quick Test Samples for Instant Demo -->
          <div class="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <div class="flex items-center gap-2 mb-2.5">
              <i class="fa-solid fa-wand-magic-sparkles text-amber-700 text-xs"></i>
              <h3 class="text-xs font-bold text-stone-800 uppercase tracking-wider">${t("orPickSample")}</h3>
            </div>
            
            <div class="grid grid-cols-2 gap-2">
              <button class="sample-craft-btn text-left p-2 rounded-xl border border-stone-200 hover:border-amber-600 hover:bg-amber-50/50 transition flex items-center gap-2"
                      data-sample-url="/static/images/products/terracotta_vase.jpg" data-sample-name="terracotta_vase.jpg">
                <img src="/static/images/products/terracotta_vase.jpg" class="w-10 h-10 rounded-lg object-cover">
                <div class="truncate">
                  <div class="text-xs font-bold text-stone-900">${t("sampleVase")}</div>
                  <div class="text-[10px] text-stone-500">Clay Pottery</div>
                </div>
              </button>

              <button class="sample-craft-btn text-left p-2 rounded-xl border border-stone-200 hover:border-amber-600 hover:bg-amber-50/50 transition flex items-center gap-2"
                      data-sample-url="/static/images/products/bankura_horse.jpg" data-sample-name="bankura_horse.jpg">
                <img src="/static/images/products/bankura_horse.jpg" class="w-10 h-10 rounded-lg object-cover">
                <div class="truncate">
                  <div class="text-xs font-bold text-stone-900">${t("sampleHorse")}</div>
                  <div class="text-[10px] text-stone-500">Bankura Craft</div>
                </div>
              </button>

              <button class="sample-craft-btn text-left p-2 rounded-xl border border-stone-200 hover:border-amber-600 hover:bg-amber-50/50 transition flex items-center gap-2"
                      data-sample-url="/static/images/products/madhubani_tree.jpg" data-sample-name="madhubani_tree.jpg">
                <img src="/static/images/products/madhubani_tree.jpg" class="w-10 h-10 rounded-lg object-cover">
                <div class="truncate">
                  <div class="text-xs font-bold text-stone-900">${t("samplePainting")}</div>
                  <div class="text-[10px] text-stone-500">Folk Art</div>
                </div>
              </button>

              <button class="sample-craft-btn text-left p-2 rounded-xl border border-stone-200 hover:border-amber-600 hover:bg-amber-50/50 transition flex items-center gap-2"
                      data-sample-url="/static/images/products/dhokra_musician.jpg" data-sample-name="dhokra_musician.jpg">
                <img src="/static/images/products/dhokra_musician.jpg" class="w-10 h-10 rounded-lg object-cover">
                <div class="truncate">
                  <div class="text-xs font-bold text-stone-900">${t("sampleBrass")}</div>
                  <div class="text-[10px] text-stone-500">Lost-Wax Metal</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (currentStep === 2) {
      const orig = enhancementData?.image_enhancement?.original_url;
      const enh = enhancementData?.image_enhancement?.enhanced_url;
      const metrics = enhancementData?.image_enhancement?.metrics || {};

      return `
        <div class="space-y-4 animate-fade-in">
          <div class="text-center">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-1">
              <i class="fa-solid fa-sparkles text-emerald-600"></i> AI Enhancement Complete
            </span>
            <h2 class="text-lg font-black text-stone-900">Compare Quality (Slide to View)</h2>
            <p class="text-xs text-stone-500">Drag the slider horizontally to compare your raw photo with AI studio lighting.</p>
          </div>

          <!-- Interactive Before / After Image Slider -->
          <div class="relative w-full aspect-square max-w-sm mx-auto rounded-3xl overflow-hidden shadow-xl border-2 border-amber-200 select-none" id="slider-container">
            <!-- Enhanced Image (Full Background) -->
            <img src="${enh}" class="absolute inset-0 w-full h-full object-cover" id="img-enhanced" alt="Enhanced Photo">

            <!-- Original Image (Clipped Overlay) -->
            <div class="absolute inset-0 overflow-hidden w-1/2" id="slider-overlay">
              <img src="${orig}" class="absolute inset-0 w-full h-full object-cover max-w-none" id="img-original" style="width: 100%; height: 100%;" alt="Original Photo">
              <div class="absolute top-3 left-3 bg-black/75 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs">
                ${t("sliderBefore")}
              </div>
            </div>

            <!-- Enhanced Label -->
            <div class="absolute top-3 right-3 bg-amber-700/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md backdrop-blur-xs shadow">
              ${t("sliderAfter")} ✨
            </div>

            <!-- Draggable Divider Line & Knob -->
            <div class="absolute inset-y-0 left-1/2 -ml-0.5 w-1 bg-white cursor-ew-resize shadow-2xl flex items-center justify-center" id="slider-divider">
              <div class="w-8 h-8 rounded-full bg-white text-stone-800 shadow-xl border-2 border-amber-700 flex items-center justify-center text-xs">
                <i class="fa-solid fa-arrows-left-right text-[10px]"></i>
              </div>
            </div>
          </div>

          <!-- Enhancement Metrics Badges -->
          <div class="grid grid-cols-3 gap-2 text-center">
            <div class="bg-amber-50/80 border border-amber-200 rounded-xl p-2.5">
              <div class="text-xs font-black text-amber-900">${metrics.lighting_improvement || '+24%'}</div>
              <div class="text-[9px] text-amber-700 font-bold uppercase">${t("metricsLighting")}</div>
            </div>
            <div class="bg-emerald-50/80 border border-emerald-200 rounded-xl p-2.5">
              <div class="text-xs font-black text-emerald-900">${metrics.sharpness_gain || '+35%'}</div>
              <div class="text-[9px] text-emerald-700 font-bold uppercase">${t("metricsSharpness")}</div>
            </div>
            <div class="bg-purple-50/80 border border-purple-200 rounded-xl p-2.5">
              <div class="text-xs font-black text-purple-900">${metrics.studio_grade || 'Studio A+'}</div>
              <div class="text-[9px] text-purple-700 font-bold uppercase">${t("metricsStudio")}</div>
            </div>
          </div>

          <button id="btn-confirm-enhancement" class="w-full bg-amber-700 hover:bg-amber-800 text-white font-black py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center gap-2">
            <span>Next: Review AI Details</span>
            <i class="fa-solid fa-arrow-right"></i>
          </button>
        </div>
      `;
    }

    if (currentStep === 3) {
      const cat = aiCatalogData || {};

      return `
        <div class="space-y-4 animate-fade-in">
          <div class="text-center">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold mb-1">
              <i class="fa-solid fa-brain text-purple-600"></i> AI Catalog Generated
            </span>
            <h2 class="text-lg font-black text-stone-900">${t("step3Title")}</h2>
            <p class="text-xs text-stone-500">${t("step3Sub")}</p>
          </div>

          <div class="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-3.5">
            <!-- Product Title -->
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span>${t("craftTitle")}</span>
                <span class="text-[10px] text-amber-700 font-normal">Auto-optimized for buyers</span>
              </label>
              <input type="text" id="ai-title-input" value="${cat.title || cat.name || ''}" 
                     class="w-full px-3 py-2 text-xs font-bold text-stone-900 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-600">
            </div>

            <!-- Product Category -->
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1">${t("craftCategory")}</label>
              <input type="text" id="ai-category-input" value="${cat.category_name || 'Pottery & Terracotta'}" readonly
                     class="w-full px-3 py-2 text-xs font-semibold text-stone-700 bg-stone-50 rounded-xl border border-stone-200">
            </div>

            <!-- Story & Description -->
            <div>
              <div class="flex items-center justify-between mb-1">
                <label class="text-xs font-bold text-stone-700">${t("craftDescription")}</label>
                <button type="button" id="btn-read-description" class="text-[11px] text-amber-700 font-bold hover:underline flex items-center gap-1">
                  <i class="fa-solid fa-volume-high"></i> Listen
                </button>
              </div>
              <textarea id="ai-description-input" rows="3" 
                        class="w-full px-3 py-2 text-xs text-stone-800 rounded-xl border border-stone-300 focus:ring-2 focus:ring-amber-600 leading-relaxed">${cat.description || ''}</textarea>
            </div>

            <!-- Materials & Technique -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">${t("craftMaterial")}</label>
                <input type="text" id="ai-material-input" value="${cat.material || 'Natural Clay'}"
                       class="w-full px-3 py-2 text-xs text-stone-800 rounded-xl border border-stone-300">
              </div>
              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">${t("craftTechnique")}</label>
                <input type="text" id="ai-technique-input" value="${cat.craft_details || 'Hand-thrown'}"
                       class="w-full px-3 py-2 text-xs text-stone-800 rounded-xl border border-stone-300">
              </div>
            </div>

            <!-- AI Tags -->
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1.5">${t("craftTags")}</label>
              <div class="flex flex-wrap gap-1.5">
                ${(cat.tags || ["Handmade", "Traditional", "Artisan"]).map(tag => `
                  <span class="bg-amber-50 border border-amber-200 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-md">
                    #${tag}
                  </span>
                `).join('')}
              </div>
            </div>
          </div>

          <!-- Buttons -->
          <div class="flex gap-2">
            <button id="btn-regenerate-ai" class="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3 rounded-2xl text-xs flex items-center justify-center gap-1.5 border border-stone-300">
              <i class="fa-solid fa-rotate text-amber-700"></i> ${t("btnRegenerate")}
            </button>

            <button id="btn-confirm-details" class="flex-1 bg-amber-700 hover:bg-amber-800 text-white font-black py-3 rounded-2xl text-xs shadow flex items-center justify-center gap-1.5">
              <span>Next: Set Price</span>
              <i class="fa-solid fa-arrow-right"></i>
            </button>
          </div>
        </div>
      `;
    }

    if (currentStep === 4) {
      const cat = aiCatalogData || {};
      const minP = cat.suggested_min_price || 650;
      const maxP = cat.suggested_max_price || 950;
      const rationale = cat.ai_rationale || "Based on authentic handcrafted materials and current artisan market demand.";

      return `
        <div class="space-y-4 animate-fade-in">
          <div class="text-center">
            <h2 class="text-lg font-black text-stone-900">${t("step4Title")}</h2>
            <p class="text-xs text-stone-500">${t("step4Sub")}</p>
          </div>

          <!-- AI Price Recommendation Callout -->
          <div class="bg-amber-50 border-2 border-amber-300/80 rounded-2xl p-4 shadow-xs">
            <div class="flex items-center gap-2 mb-1.5">
              <div class="w-6 h-6 rounded-full bg-amber-700 text-white flex items-center justify-center text-[11px]">
                <i class="fa-solid fa-chart-line"></i>
              </div>
              <span class="text-xs font-bold text-amber-900 uppercase tracking-wider">${t("aiPriceSuggestion")}</span>
            </div>
            <div class="text-xl font-black text-amber-900 ml-8">
              ₹${minP} – ₹${maxP}
            </div>
            <p class="text-[11px] text-amber-800/90 ml-8 mt-1 leading-snug">
              ${rationale}
            </p>
          </div>

          <!-- Seller Pricing Form -->
          <div class="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <!-- Selling Price -->
            <div>
              <label class="block text-xs font-bold text-stone-800 mb-1.5">${t("sellingPrice")} *</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-lg font-bold text-stone-500 pointer-events-none">₹</span>
                <input type="number" id="input-selling-price" value="${finalPrice}" min="50" step="10"
                       class="w-full pl-9 pr-3 py-3 text-lg font-black text-stone-900 rounded-2xl border-2 border-stone-300 focus:border-amber-700 focus:outline-none">
              </div>
            </div>

            <!-- Original MRP (Optional for discount display) -->
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1.5">${t("originalPriceOptional")}</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-bold text-stone-400 pointer-events-none">₹</span>
                <input type="number" id="input-original-price" value="${Math.round(finalPrice * 1.25)}" min="50"
                       class="w-full pl-9 pr-3 py-2 text-sm font-semibold text-stone-600 rounded-xl border border-stone-200">
              </div>
            </div>

            <!-- Stock Quantity Stepper -->
            <div>
              <label class="block text-xs font-bold text-stone-800 mb-1.5">${t("quantityInStock")} *</label>
              <div class="flex items-center gap-3">
                <button type="button" id="btn-qty-minus" class="w-12 h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-xl flex items-center justify-center border border-stone-200">
                  -
                </button>
                <input type="number" id="input-quantity" value="${finalQuantity}" min="1" max="999"
                       class="w-20 py-2.5 text-center text-lg font-black text-stone-900 rounded-2xl border-2 border-stone-300">
                <button type="button" id="btn-qty-plus" class="w-12 h-12 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-black text-xl flex items-center justify-center border border-stone-200">
                  +
                </button>
                <span class="text-xs text-stone-500 font-medium">units ready to ship</span>
              </div>
            </div>
          </div>

          <!-- Publish Action Button -->
          <button id="btn-publish-craft" class="w-full bg-gradient-to-r from-orange-600 via-amber-700 to-amber-800 hover:from-orange-700 hover:to-amber-900 text-white font-black py-4 rounded-2xl shadow-xl text-base flex items-center justify-center gap-2 transform active:scale-98 transition">
            <i class="fa-solid fa-sparkles text-amber-300"></i>
            <span>${t("btnPublishProduct")}</span>
          </button>
        </div>
      `;
    }

    if (currentStep === 5) {
      return `
        <div class="text-center py-8 space-y-4 animate-fade-in">
          <div class="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-4xl mx-auto shadow-lg animate-bounce">
            <i class="fa-solid fa-check"></i>
          </div>

          <h2 class="text-xl font-black text-stone-900">Congratulations! 🎉</h2>
          <p class="text-xs text-stone-600 max-w-xs mx-auto leading-relaxed">
            ${t("listingSuccess")}
          </p>

          <div class="bg-white border border-stone-200 rounded-2xl p-4 max-w-xs mx-auto shadow-xs text-left flex items-center gap-3">
            <img src="${enhancementData?.image_enhancement?.enhanced_url || enhancementData?.image_enhancement?.original_url}" class="w-14 h-14 rounded-xl object-cover border border-stone-200">
            <div class="min-w-0">
              <h4 class="text-xs font-bold text-stone-900 truncate">${aiCatalogData?.name || 'Handmade Craft'}</h4>
              <p class="text-xs font-black text-amber-800 mt-0.5">₹${finalPrice}</p>
              <span class="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">Active on Store</span>
            </div>
          </div>

          <div class="pt-4 flex flex-col gap-2 max-w-xs mx-auto">
            <button id="btn-go-dashboard" class="bg-amber-700 hover:bg-amber-800 text-white font-bold py-3 rounded-2xl text-xs shadow">
              Go to Artisan Dashboard
            </button>
            <button id="btn-go-marketplace" class="bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold py-3 rounded-2xl text-xs">
              View on Buyer Marketplace
            </button>
          </div>
        </div>
      `;
    }

    return '';
  }

  function bindStepEvents() {
    // Back navigation
    const btnBack = document.getElementById("btn-wizard-back");
    if (btnBack) {
      btnBack.addEventListener("click", () => {
        if (currentStep > 1) {
          currentStep--;
          render();
        } else {
          window.app.navigate("seller_dashboard");
        }
      });
    }

    // Audio assistance
    const btnVoice = document.getElementById("btn-step-voice");
    if (btnVoice) {
      btnVoice.addEventListener("click", () => {
        if (currentStep === 1) {
          speakText(currentLanguage === 'hi' ? "चरण 1: अपने हस्तनिर्मित उत्पाद की साफ़ तस्वीर खींचें या गैलरी से चुनें।" : "Step 1: Take a clear photo of your handmade item using your camera or pick a sample craft.");
        } else if (currentStep === 2) {
          speakText(currentLanguage === 'hi' ? "चरण 2: स्क्रीन पर दिए गए स्लाइडर को खिसका कर देखें कि एआई ने फोटो को कितना सुंदर और चमकदार बनाया है।" : "Step 2: Drag the slider horizontally to compare your raw photo with AI studio lighting.");
        } else if (currentStep === 3) {
          speakText(currentLanguage === 'hi' ? "चरण 3: एआई द्वारा तैयार विवरण को जांचें और यदि चाहें तो बदलें।" : "Step 3: Review the AI generated title and story. You can edit any field.");
        } else if (currentStep === 4) {
          speakText(currentLanguage === 'hi' ? "चरण 4: अपना विक्रय मूल्य और उपलब्ध संख्या दर्ज करें और प्रकाशित करें।" : "Step 4: Set your selling price and available stock, then tap Publish.");
        }
      });
    }

    // Step 1: Camera & File inputs
    const camInput = document.getElementById("file-input-camera");
    const galInput = document.getElementById("file-input-gallery");
    const btnCam = document.getElementById("btn-open-camera");
    const btnGal = document.getElementById("btn-open-gallery");

    if (btnCam && camInput) btnCam.onclick = () => camInput.click();
    if (btnGal && galInput) btnGal.onclick = () => galInput.click();

    const handleFile = async (file) => {
      if (!file) return;
      selectedFile = file;
      await processUploadedImage(file);
    };

    if (camInput) camInput.onchange = (e) => handleFile(e.target.files[0]);
    if (galInput) galInput.onchange = (e) => handleFile(e.target.files[0]);

    // Sample buttons
    container.querySelectorAll(".sample-craft-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const sampleUrl = btn.getAttribute("data-sample-url");
        const sampleName = btn.getAttribute("data-sample-name");
        try {
          showToast("Loading sample craft photo...", "info");
          // Fetch the image as a Blob to simulate upload
          const res = await fetch(sampleUrl);
          const blob = await res.blob();
          const file = new File([blob], sampleName, { type: "image/jpeg" });
          await processUploadedImage(file);
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });

    // Step 2: Slider logic
    if (currentStep === 2) {
      setupComparisonSlider();

      const btnConfirmEnhancement = document.getElementById("btn-confirm-enhancement");
      if (btnConfirmEnhancement) {
        btnConfirmEnhancement.addEventListener("click", () => {
          currentStep = 3;
          render();
        });
      }
    }

    // Step 3: AI Details
    if (currentStep === 3) {
      const btnRegenerate = document.getElementById("btn-regenerate-ai");
      const btnConfirmDetails = document.getElementById("btn-confirm-details");
      const btnReadDesc = document.getElementById("btn-read-description");

      if (btnReadDesc) {
        btnReadDesc.addEventListener("click", () => {
          const desc = document.getElementById("ai-description-input").value;
          speakText(desc);
        });
      }

      if (btnRegenerate) {
        btnRegenerate.addEventListener("click", async () => {
          const hint = prompt("Add an artisan craft hint for AI (optional):", "Traditional handmade craft");
          try {
            showToast("AI is writing updated details...", "info");
            const res = await api.regenerateAiText(enhancementData.image_enhancement.original_url, currentLanguage, hint);
            aiCatalogData = res.ai_catalog;
            render();
          } catch (err) {
            showToast(err.message, "error");
          }
        });
      }

      if (btnConfirmDetails) {
        btnConfirmDetails.addEventListener("click", () => {
          // Save edited values back to aiCatalogData
          aiCatalogData.title = document.getElementById("ai-title-input").value.trim();
          aiCatalogData.description = document.getElementById("ai-description-input").value.trim();
          aiCatalogData.material = document.getElementById("ai-material-input").value.trim();
          aiCatalogData.craft_details = document.getElementById("ai-technique-input").value.trim();
          finalPrice = aiCatalogData.suggested_min_price || 750;
          currentStep = 4;
          render();
        });
      }
    }

    // Step 4: Pricing & Stock
    if (currentStep === 4) {
      const priceInput = document.getElementById("input-selling-price");
      const origPriceInput = document.getElementById("input-original-price");
      const qtyInput = document.getElementById("input-quantity");
      const btnMinus = document.getElementById("btn-qty-minus");
      const btnPlus = document.getElementById("btn-qty-plus");
      const btnPublish = document.getElementById("btn-publish-craft");

      if (btnMinus) {
        btnMinus.onclick = () => {
          let v = parseInt(qtyInput.value) || 1;
          if (v > 1) qtyInput.value = v - 1;
        };
      }
      if (btnPlus) {
        btnPlus.onclick = () => {
          let v = parseInt(qtyInput.value) || 1;
          qtyInput.value = v + 1;
        };
      }

      if (btnPublish) {
        btnPublish.addEventListener("click", async () => {
          const price = parseFloat(priceInput.value);
          const origPrice = parseFloat(origPriceInput.value) || price;
          const quantity = parseInt(qtyInput.value) || 1;

          if (!price || price <= 0) {
            showToast("Please enter a valid selling price", "error");
            return;
          }

          finalPrice = price;
          finalQuantity = quantity;

          const payload = {
            name: aiCatalogData.name || aiCatalogData.title,
            title: aiCatalogData.title,
            description: aiCatalogData.description,
            category_id: aiCatalogData.category_id || 1,
            material: aiCatalogData.material,
            craft_details: aiCatalogData.craft_details,
            tags: aiCatalogData.tags || [],
            price: price,
            original_price: origPrice,
            quantity: quantity,
            original_image_url: enhancementData.image_enhancement.original_url,
            enhanced_image_url: enhancementData.image_enhancement.enhanced_url,
            ai_generated_meta: {
              ...aiCatalogData,
              enhancement_metrics: enhancementData.image_enhancement.metrics
            }
          };

          if (!api.token) {
            showToast(t("loginRequiredArtisan"), "info");
            window.app.navigate("auth", { mode: "login" });
            return;
          }

          try {
            showToast("Publishing to marketplace...", "info");
            await api.createProduct(payload);
            currentStep = 5;
            render();
          } catch (err) {
            showToast(err.message, "error");
          }
        });
      }
    }

    // Step 5: Success navigation
    if (currentStep === 5) {
      document.getElementById("btn-go-dashboard")?.addEventListener("click", () => {
        window.app.navigate("seller_dashboard");
      });
      document.getElementById("btn-go-marketplace")?.addEventListener("click", () => {
        window.app.navigate("buyer_marketplace");
      });
    }
  }

  async function processUploadedImage(file) {
    if (!api.token) {
      showToast(t("loginRequiredArtisan"), "info");
      window.app.navigate("auth", { mode: "login" });
      return;
    }

    try {
      showLoadingModal("AI Enhancing Your Photo...", "Balancing lighting, sharpening textures, and generating marketplace details...");
      const formData = new FormData();
      formData.append("file", file);
      formData.append("language", currentLanguage);

      const res = await api.uploadAndEnhance(formData);
      enhancementData = res;
      aiCatalogData = res.ai_catalog;
      finalPrice = res.ai_catalog.suggested_min_price || 750;

      hideLoadingModal();
      currentStep = 2;
      render();
    } catch (err) {
      hideLoadingModal();
      showToast(err.message, "error");
    }
  }

  function setupComparisonSlider() {
    const container = document.getElementById("slider-container");
    const overlay = document.getElementById("slider-overlay");
    const divider = document.getElementById("slider-divider");
    const imgOriginal = document.getElementById("img-original");
    if (!container || !overlay || !divider) return;

    // Ensure inner img width matches container width
    const updateDimensions = () => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (imgOriginal) {
        imgOriginal.style.width = `${w}px`;
        imgOriginal.style.height = `${h}px`;
      }
    };
    updateDimensions();

    let isDragging = false;

    const moveSlider = (clientX) => {
      const rect = container.getBoundingClientRect();
      let x = clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      const percentage = (x / rect.width) * 100;

      overlay.style.width = `${percentage}%`;
      divider.style.left = `${percentage}%`;
    };

    // Mouse Events
    divider.addEventListener("mousedown", () => isDragging = true);
    window.addEventListener("mouseup", () => isDragging = false);
    container.addEventListener("mousemove", (e) => {
      if (isDragging) moveSlider(e.clientX);
    });

    // Touch Events for Mobile
    divider.addEventListener("touchstart", () => isDragging = true, { passive: true });
    window.addEventListener("touchend", () => isDragging = false);
    container.addEventListener("touchmove", (e) => {
      if (isDragging && e.touches[0]) {
        moveSlider(e.touches[0].clientX);
      }
    }, { passive: true });
  }

  render();
}

function showLoadingModal(title, message) {
  let modal = document.getElementById("ai-loading-modal");
  if (!modal) {
    modal = document.createElement("div");
    modal.id = "ai-loading-modal";
    modal.className = "fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in";
    modal.innerHTML = `
      <div class="bg-white rounded-3xl p-6 max-w-xs w-full shadow-2xl border border-stone-200 text-center space-y-4">
        <div class="relative w-18 h-18 mx-auto flex items-center justify-center">
          <div class="absolute inset-0 rounded-full border-4 border-amber-200 border-t-amber-700 animate-spin"></div>
          <i class="fa-solid fa-wand-magic-sparkles text-2xl text-amber-700 animate-pulse"></i>
        </div>
        <div>
          <h3 id="loading-modal-title" class="text-sm font-black text-stone-900">AI Enhancing Your Photo...</h3>
          <p id="loading-modal-msg" class="text-xs text-stone-500 mt-1 leading-relaxed">Adjusting exposure and generating catalog details...</p>
        </div>
        <div class="w-full bg-stone-100 rounded-full h-1.5 overflow-hidden">
          <div class="bg-amber-700 h-full rounded-full animate-progress" style="width: 70%"></div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  if (title) document.getElementById("loading-modal-title").innerText = title;
  if (message) document.getElementById("loading-modal-msg").innerText = message;
  modal.style.display = "flex";
}

function hideLoadingModal() {
  const modal = document.getElementById("ai-loading-modal");
  if (modal) modal.style.display = "none";
}
