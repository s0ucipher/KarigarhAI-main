// AI-Powered Product Listing Wizard for Artisans

function renderSellerAddProduct(container) {
  let currentStep = 1; // 1: Photo, 2: AI Enhance & Compare, 3: AI Details, 4: Pricing & Stock, 5: Success
  let selectedFile = null;
  let selectedFiles = []; // 1 to 3 files
  let stagedFiles = []; // 1 to 3 photos chosen in Step 1
  let activePhotoIndex = 0; // index of active photo in Step 2 compare slider
  let enhancementData = null;
  let aiCatalogData = null;
  let finalPrice = null;
  let originalMarketValue = null;
  let isSellingPriceUserEdited = false;
  let isOriginalPriceUserEdited = false;
  let finalQuantity = 5;
  let sellerCostMaterial = "";
  let sellerCostLabor = "";
  let sellerCostOther = "";
  let isCostCalculatorOpen = false;

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
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold mb-1 shadow-xs">
              <i class="fa-solid fa-layer-group text-amber-700"></i> ${t("multiPhotoBadge", "Multiple Photo Upload (1–3 Photos)")}
            </span>
            <h2 class="text-lg font-black text-stone-900">${t("step1Title", "1. Upload Product Photos (1 to 3 Photos)")}</h2>
            <p class="text-xs text-stone-500 mt-1 max-w-sm mx-auto">${t("step1Sub", "Upload 1 to 3 clear photos of your handmade craft (front, angle, and detail).")}</p>
          </div>

          <!-- Big Camera & Upload Dropzone -->
          <div class="bg-gradient-to-b from-amber-50 to-stone-50 border-2 border-dashed border-amber-300 rounded-3xl p-5 text-center shadow-xs">
            <input type="file" id="file-input-camera" accept="image/*" capture="environment" class="hidden">
            <input type="file" id="file-input-gallery" accept="image/*" multiple class="hidden">

            <!-- 3 Visual Photo Slots (1 to 3 Photos) -->
            <div class="bg-white/80 border border-amber-200/80 rounded-2xl p-3 mb-4 shadow-xs text-left">
              <div class="flex items-center justify-between text-xs font-black text-stone-800 mb-2">
                <span class="flex items-center gap-1.5">
                  <i class="fa-solid fa-images text-amber-700"></i>
                  <span>Product Photo Slots (1 to 3)</span>
                </span>
                <span class="text-[10px] text-amber-800 bg-amber-100 font-bold px-2 py-0.5 rounded-full">
                  Min: 1 • Max: 3
                </span>
              </div>

              <div class="grid grid-cols-3 gap-2.5">
                ${[
                  { label: "1. Front", sub: "Main View" },
                  { label: "2. Angle", sub: "Side View" },
                  { label: "3. Detail", sub: "Close-up" }
                ].map((slot, idx) => {
                  const file = stagedFiles[idx];
                  if (file) {
                    const previewUrl = URL.createObjectURL(file);
                    return `
                      <div class="relative aspect-square rounded-xl overflow-hidden border-2 border-amber-600 shadow-xs group bg-stone-100">
                        <img src="${previewUrl}" class="w-full h-full object-cover">
                        <span class="absolute bottom-0.5 left-0.5 bg-black/75 text-white text-[8px] font-bold px-1 rounded-xs">#${idx + 1}</span>
                        <button type="button" class="btn-remove-photo absolute top-0.5 right-0.5 w-4 h-4 bg-rose-600 hover:bg-rose-700 text-white rounded-full flex items-center justify-center text-[9px] shadow cursor-pointer" data-remove-index="${idx}" title="Remove photo">✕</button>
                      </div>
                    `;
                  } else {
                    return `
                      <button type="button" class="btn-slot-trigger aspect-square rounded-xl border-2 border-dashed border-amber-200 hover:border-amber-600 hover:bg-amber-50/60 transition flex flex-col items-center justify-center p-2 text-stone-400 hover:text-amber-800 cursor-pointer" data-slot-index="${idx}">
                        <i class="fa-solid fa-plus text-sm text-amber-600 mb-0.5"></i>
                        <span class="text-[10px] font-bold text-stone-700 leading-none">${slot.label}</span>
                        <span class="text-[9px] text-stone-400 leading-none mt-0.5">${slot.sub}</span>
                      </button>
                    `;
                  }
                }).join('')}
              </div>

              ${stagedFiles.length > 0 ? `
              <div class="mt-2.5 pt-2 border-t border-amber-100 flex items-center justify-between text-[11px]">
                <span class="font-bold text-amber-900">
                  <i class="fa-solid fa-circle-check text-emerald-600"></i> ${stagedFiles.length} of 3 photos chosen
                </span>
                <button type="button" id="btn-clear-photos" class="text-rose-600 hover:text-rose-800 font-semibold hover:underline cursor-pointer">
                  Clear all
                </button>
              </div>
              ` : ''}
            </div>

            ${stagedFiles.length > 0 ? `
            <!-- Primary Action: Enhance Staged Photos -->
            <button id="btn-enhance-staged" class="w-full mb-3 bg-gradient-to-r from-amber-700 to-orange-600 hover:from-amber-800 hover:to-orange-700 text-white font-black py-3.5 px-4 rounded-2xl text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer">
              <i class="fa-solid fa-wand-magic-sparkles"></i>
              <span>Enhance ${stagedFiles.length} Photo${stagedFiles.length > 1 ? 's' : ''} with AI Studio Lighting →</span>
            </button>

            ${stagedFiles.length < 3 ? `
            <div class="grid grid-cols-2 gap-2 max-w-xs mx-auto">
              <button id="btn-open-gallery" class="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-plus text-xs text-amber-700"></i>
                <span>Add More Photos</span>
              </button>

              <button id="btn-open-camera" class="bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-bold py-2.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer">
                <i class="fa-solid fa-camera text-xs text-amber-700"></i>
                <span>Take Photo</span>
              </button>
            </div>
            ` : ''}
            ` : `
            <!-- 0 Photos Chosen Yet: Show Primary Upload Buttons -->
            <div class="grid grid-cols-2 gap-3 max-w-xs mx-auto">
              <button id="btn-open-gallery" class="bg-amber-700 hover:bg-amber-800 text-white font-bold py-3.5 px-3 rounded-2xl text-xs shadow flex items-center justify-center gap-2 cursor-pointer">
                <i class="fa-solid fa-images text-sm"></i>
                <span>${t("btnUploadPhoto", "Upload Photos (1–3)")}</span>
              </button>

              <button id="btn-open-camera" class="bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-bold py-3.5 px-3 rounded-2xl text-xs shadow-xs flex items-center justify-center gap-2 cursor-pointer">
                <i class="fa-solid fa-camera-retro text-amber-700 text-sm"></i>
                <span>${t("btnCapturePhoto", "Take Photo")}</span>
              </button>
            </div>
            `}

            <p class="text-[11px] text-stone-500 font-medium mt-3">Select 1 to 3 photos at once or tap slots to add multiple craft angles</p>
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

              <button class="sample-craft-btn col-span-2 text-left p-2.5 rounded-xl border border-amber-300 bg-amber-50/70 hover:border-amber-600 hover:bg-amber-100/60 transition flex items-center gap-3"
                      data-sample-multi="true" data-sample-urls="/static/images/products/terracotta_vase.jpg,/static/images/products/bankura_horse.jpg,/static/images/products/dhokra_musician.jpg" data-sample-name="multi_angle_craft" id="btn-sample-multi-photo">
                <div class="flex -space-x-2 overflow-hidden shrink-0">
                  <img src="/static/images/products/terracotta_vase.jpg" class="inline-block w-8 h-8 rounded-lg object-cover ring-2 ring-white">
                  <img src="/static/images/products/bankura_horse.jpg" class="inline-block w-8 h-8 rounded-lg object-cover ring-2 ring-white">
                  <img src="/static/images/products/dhokra_musician.jpg" class="inline-block w-8 h-8 rounded-lg object-cover ring-2 ring-white">
                </div>
                <div class="truncate">
                  <div class="text-xs font-bold text-stone-900">Try Multi-Photo Demo (3 Craft Photos)</div>
                  <div class="text-[10px] text-amber-800">Front, Side, & Angled Craft Views</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (currentStep === 2) {
      const enhancements = enhancementData?.image_enhancements || (enhancementData?.image_enhancement ? [enhancementData.image_enhancement] : []);
      const safeIndex = Math.min(Math.max(0, activePhotoIndex), Math.max(0, enhancements.length - 1));
      const currentPhoto = enhancements[safeIndex] || enhancements[0] || {};
      const orig = currentPhoto.original_url;
      const enh = currentPhoto.enhanced_url;
      const status = currentPhoto.status || 'enhanced';

      const isOriginalPreserved = status === 'original_preserved';
      const badgeText = isOriginalPreserved ? 'Photo Quality Verified (Authentic)' : 'Studio Isolation & Enhancement';
      const badgeIcon = isOriginalPreserved ? 'fa-shield-halved text-amber-700' : 'fa-wand-magic-sparkles text-emerald-600';
      const badgeBg = isOriginalPreserved ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800';
      const subText = isOriginalPreserved
        ? 'Your photograph has balanced natural lighting and sharpness. Original craftsmanship was preserved.'
        : 'The product was isolated onto a clean solid studio background with refined lighting & clarity.';
      const afterLabel = isOriginalPreserved ? 'Verified Authentic ✨' : 'Studio Photo ✨';

      return `
        <div class="space-y-4 animate-fade-in">
          <div class="text-center">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${badgeBg} text-[11px] font-bold mb-1">
              <i class="fa-solid ${badgeIcon}"></i> ${badgeText}
            </span>
            <h2 class="text-lg font-black text-stone-900">Compare Studio Quality (Slide to View)</h2>
            <p class="text-xs text-stone-500">${subText}</p>
          </div>

          ${enhancements.length > 1 ? `
          <!-- Multi-photo selector tabs -->
          <div class="flex items-center justify-center gap-2 py-1">
            ${enhancements.map((p, idx) => `
              <button type="button" class="photo-selector-tab relative rounded-2xl overflow-hidden border-2 transition-all p-0.5 ${idx === safeIndex ? 'border-amber-600 ring-2 ring-amber-300 scale-105 shadow-md' : 'border-stone-200 opacity-70 hover:opacity-100 hover:border-amber-300'}" data-photo-index="${idx}">
                <img src="${p.enhanced_url || p.original_url}" class="w-12 h-12 object-cover rounded-xl" alt="Photo ${idx + 1}">
                <span class="absolute bottom-1 right-1 bg-black/75 text-white text-[9px] font-bold px-1 rounded-sm">${idx + 1}</span>
              </button>
            `).join('')}
          </div>
          <p class="text-[11px] text-center text-stone-500 font-medium">Viewing Photo ${safeIndex + 1} of ${enhancements.length} • Tap thumbnails to compare each photo</p>
          ` : ''}

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
              ${afterLabel}
            </div>

            <!-- Draggable Divider Line & Knob -->
            <div class="absolute inset-y-0 left-1/2 -ml-0.5 w-1 bg-white cursor-ew-resize shadow-2xl flex items-center justify-center" id="slider-divider">
              <div class="w-8 h-8 rounded-full bg-white text-stone-800 shadow-xl border-2 border-amber-700 flex items-center justify-center text-xs">
                <i class="fa-solid fa-arrows-left-right text-[10px]"></i>
              </div>
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
      const va = cat.visual_analysis || {};

      return `
        <div class="space-y-4 animate-fade-in">
          <div class="text-center">
            <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold mb-1">
              <i class="fa-solid fa-brain text-purple-600"></i> AI Catalog Generated
            </span>
            <h2 class="text-lg font-black text-stone-900">${t("step3Title")}</h2>
            <p class="text-xs text-stone-500">${t("step3Sub")}</p>
          </div>

          <!-- Deep Visual Analysis Evidence Callout -->
          ${(cat.craftsmanship_level || cat.complexity_score !== undefined || cat.labor_intensity || va.craft_style) ? `
          <div class="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-3.5 shadow-xs space-y-2">
            <div class="flex items-center justify-between text-[11px] font-black text-amber-950">
              <span class="flex items-center gap-1.5">
                <i class="fa-solid fa-wand-magic-sparkles text-amber-700"></i> Visual Craft Analysis
              </span>
              <span class="text-[10px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                Evidence-Based
              </span>
            </div>
            <div class="flex flex-wrap gap-1.5 text-[11px]">
              ${cat.craftsmanship_level ? `
                <span class="inline-flex items-center gap-1 bg-white/90 border border-amber-200 px-2.5 py-1 rounded-lg font-bold text-stone-800 shadow-2xs">
                  <i class="fa-solid fa-gem text-amber-600 text-[10px]"></i> Craftsmanship: <span class="capitalize text-amber-900">${cat.craftsmanship_level}</span>
                </span>
              ` : ''}
              ${(cat.complexity_score !== undefined && cat.complexity_score !== null) ? `
                <span class="inline-flex items-center gap-1 bg-white/90 border border-amber-200 px-2.5 py-1 rounded-lg font-bold text-stone-800 shadow-2xs">
                  <i class="fa-solid fa-gauge-high text-amber-600 text-[10px]"></i> Complexity: <span class="text-amber-900">${cat.complexity_score}/100</span>
                </span>
              ` : ''}
              ${cat.labor_intensity ? `
                <span class="inline-flex items-center gap-1 bg-white/90 border border-amber-200 px-2.5 py-1 rounded-lg font-bold text-stone-800 shadow-2xs">
                  <i class="fa-solid fa-hand-holding-hand text-amber-600 text-[10px]"></i> Labor: <span class="capitalize text-amber-900">${cat.labor_intensity}</span>
                </span>
              ` : ''}
              ${va.craft_style && va.craft_style !== 'Unknown' ? `
                <span class="inline-flex items-center gap-1 bg-white/90 border border-amber-200 px-2.5 py-1 rounded-lg font-medium text-stone-700 shadow-2xs">
                  <i class="fa-solid fa-shapes text-amber-600 text-[10px]"></i> Style: <span>${va.craft_style}</span>
                </span>
              ` : ''}
            </div>
          </div>
          ` : ''}

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
              <input type="text" id="ai-category-input" value="${cat.category_name || 'Handmade Craft'}" readonly
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
                <input type="text" id="ai-material-input" value="${cat.material || 'Natural Material'}"
                       class="w-full px-3 py-2 text-xs text-stone-800 rounded-xl border border-stone-300">
              </div>
              <div>
                <label class="block text-xs font-bold text-stone-700 mb-1">${t("craftTechnique")}</label>
                <input type="text" id="ai-technique-input" value="${cat.craft_details || 'Handcrafted'}"
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
      const hasPrice = Boolean(cat.price_available) && typeof cat.suggested_min_price === "number" && typeof cat.suggested_max_price === "number" && cat.suggested_min_price > 0;
      const minP = hasPrice ? Math.round(cat.suggested_min_price) : null;
      const maxP = hasPrice ? Math.round(cat.suggested_max_price) : null;

      if (finalPrice === null && !isSellingPriceUserEdited && minP) {
        finalPrice = minP;
      }
      if (originalMarketValue === null && !isOriginalPriceUserEdited && finalPrice) {
        originalMarketValue = Math.round(finalPrice * 1.25);
      }

      const isRefined = (cat.price_source === "seller_costs" || cat.price_source === "artisan_cost_plus");
      let sourceBadge = "AI Product Analysis";
      let sourceIcon = "fa-chart-line";
      let titleHeader = "AI RECOMMENDED PRICE RANGE";

      if (isRefined) {
        sourceBadge = "Refined Artisan Cost-Plus Range";
        sourceIcon = "fa-calculator";
        titleHeader = "REFINED ARTISAN PRICE RANGE";
      } else if (cat.price_source === "gemini") {
        sourceBadge = "AI Curator Recommendation";
        sourceIcon = "fa-wand-magic-sparkles";
        titleHeader = "AI RECOMMENDED PRICE RANGE";
      } else {
        sourceBadge = "AI Product Analysis";
        sourceIcon = "fa-scale-balanced";
        titleHeader = "AI RECOMMENDED PRICE RANGE";
      }

      const rationale = cat.price_reason || cat.ai_rationale || (hasPrice 
        ? "AI-assisted estimated price range based on craft complexity, materials, and artisan labor."
        : "AI price recommendation is unavailable for this photograph. Please enter your fair selling price directly based on materials and crafting hours.");
      const priceFactors = Array.isArray(cat.price_factors) ? cat.price_factors : [];

      return `
        <div class="space-y-4 animate-fade-in">
          <div class="text-center">
            <h2 class="text-lg font-black text-stone-900">${t("step4Title")}</h2>
            <p class="text-xs text-stone-500">${t("step4Sub")}</p>
          </div>

          <!-- Price Recommendation Card: Mode 1 (Initial AI Recommendation) vs Mode 2 (Refined Cost-Plus) vs Indeterminate -->
          ${hasPrice ? `
          <div class="bg-gradient-to-br ${isRefined ? 'from-emerald-50 via-teal-50/40 to-emerald-100/30 border-emerald-400' : 'from-amber-50 via-orange-50/50 to-amber-100/40 border-amber-300'} border-2 rounded-2xl p-4 shadow-sm space-y-2.5 transition-all">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full ${isRefined ? 'bg-emerald-700' : 'bg-amber-700'} text-white flex items-center justify-center text-[11px] shadow-xs">
                  <i class="fa-solid ${sourceIcon}"></i>
                </div>
                <span class="text-xs font-black ${isRefined ? 'text-emerald-950' : 'text-amber-950'} tracking-wide uppercase">${titleHeader}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="text-[10px] font-bold ${isRefined ? 'text-emerald-900 bg-white/90 border-emerald-300' : 'text-amber-900 bg-white/80 border-amber-200'} px-2 py-0.5 rounded-full border shadow-2xs">
                  ${sourceBadge}
                </span>
                <span class="text-[10px] font-extrabold ${isRefined ? 'text-emerald-800 bg-emerald-100 border-emerald-300' : 'text-amber-800 bg-amber-100 border-amber-200'} px-2 py-0.5 rounded-full border">
                  ${cat.price_confidence ? Math.round(cat.price_confidence * 100) + '% Confidence' : 'Calculated'}
                </span>
              </div>
            </div>

            <div class="text-2xl font-black ${isRefined ? 'text-emerald-950' : 'text-amber-900'} ml-8 tracking-tight flex items-baseline gap-2">
              <span>₹${minP.toLocaleString('en-IN')} – ₹${maxP.toLocaleString('en-IN')}</span>
              <span class="text-[11px] font-semibold text-stone-500">${isRefined ? "refined cost-plus range" : "recommended range"}</span>
            </div>

            <div class="ml-8 space-y-1">
              <p class="text-[11px] font-semibold text-stone-700 leading-snug">
                ${rationale}
              </p>
              <p class="text-[10px] text-stone-500 italic">
                ${isRefined 
                  ? "Calculated using artisan-provided production costs and a craftsmanship-based margin." 
                  : "Based on detected product characteristics, material, craftsmanship, complexity and other available factors."}
              </p>
              ${isRefined && cat.initial_price ? `
              <div class="pt-1 flex items-center gap-1.5 text-[10px] text-emerald-900 font-medium">
                <span>Initial AI estimate was ₹${cat.initial_price.min.toLocaleString('en-IN')} – ₹${cat.initial_price.max.toLocaleString('en-IN')}.</span>
                <button type="button" id="btn-reset-initial-price" class="font-bold underline text-amber-800 hover:text-amber-950 cursor-pointer">
                  Reset to Initial AI Estimate
                </button>
              </div>
              ` : ''}
            </div>

            ${priceFactors.length > 0 ? `
            <div class="flex flex-wrap gap-1.5 ml-8 pt-1">
              ${priceFactors.map(f => `
                <span class="inline-flex items-center gap-1 bg-white/95 border ${isRefined ? 'border-emerald-200 text-emerald-950' : 'border-amber-200/90 text-amber-950'} text-[10px] font-semibold px-2 py-0.5 rounded-md shadow-2xs">
                  <i class="fa-solid fa-tag text-[9px] ${isRefined ? 'text-emerald-600' : 'text-amber-600'}"></i> ${f}
                </span>
              `).join('')}
            </div>
            ` : ''}
          </div>
          ` : `
          <!-- Indeterminate Product State (Only for blank/corrupt/unrecognizable images) -->
          <div class="bg-stone-50 border-2 border-stone-200 rounded-2xl p-4 shadow-xs space-y-1.5">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-full bg-stone-500 text-white flex items-center justify-center text-[11px]">
                <i class="fa-solid fa-pen-ruler"></i>
              </div>
              <span class="text-xs font-bold text-stone-700 uppercase tracking-wider">Direct Artisan Pricing</span>
            </div>
            <div class="text-xs font-bold text-stone-800 ml-8">
              AI Price Recommendation Unavailable
            </div>
            <p class="text-[11px] text-stone-500 ml-8 leading-relaxed">
              ${rationale}
            </p>
          </div>
          `}

          <!-- Optional Artisan Cost-Based Pricing Calculator Accordion -->
          <div class="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs">
            <button type="button" id="btn-toggle-cost-calc" class="w-full flex items-center justify-between text-left text-xs font-bold text-stone-800 hover:text-amber-800">
              <div class="flex items-center gap-2">
                <i class="fa-solid fa-calculator text-amber-700"></i>
                <span>Fine-tune with your actual production costs (Optional)</span>
              </div>
              <i class="fa-solid ${isCostCalculatorOpen ? 'fa-chevron-up' : 'fa-chevron-down'} text-stone-400 text-xs"></i>
            </button>
            
            <div id="cost-calculator-drawer" class="${isCostCalculatorOpen ? 'block' : 'hidden'} mt-3 pt-3 border-t border-stone-100 space-y-3">
              <p class="text-[11px] text-stone-500">
                If you know your raw material, artisan wages, or firing/packaging costs, enter them below. KalaSetu AI will calculate a fair artisan selling range with healthy margins.
              </p>
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-[10px] font-bold text-stone-600 mb-1">Material (₹)</label>
                  <input type="number" id="input-cost-material" value="${sellerCostMaterial}" placeholder="e.g. 350" min="0"
                         class="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-stone-200 focus:border-amber-700 focus:outline-none">
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-stone-600 mb-1">Artisan Labor (₹)</label>
                  <input type="number" id="input-cost-labor" value="${sellerCostLabor}" placeholder="e.g. 500" min="0"
                         class="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-stone-200 focus:border-amber-700 focus:outline-none">
                </div>
                <div>
                  <label class="block text-[10px] font-bold text-stone-600 mb-1">Packaging/Other (₹)</label>
                  <input type="number" id="input-cost-other" value="${sellerCostOther}" placeholder="e.g. 100" min="0"
                         class="w-full px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-stone-200 focus:border-amber-700 focus:outline-none">
                </div>
              </div>
              <div class="flex justify-end">
                <button type="button" id="btn-apply-costs" class="bg-amber-700 hover:bg-amber-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-xs flex items-center gap-1.5">
                  <i class="fa-solid fa-arrows-rotate text-[10px]"></i>
                  <span>Recalculate Price Range</span>
                </button>
              </div>
            </div>
          </div>

          <!-- Seller Pricing Form -->
          <div class="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
            <!-- Selling Price -->
            <div>
              <label class="block text-xs font-bold text-stone-800 mb-1.5">${t("sellingPrice")} *</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-lg font-bold text-stone-500 pointer-events-none">₹</span>
                <input type="number" id="input-selling-price" 
                       value="${finalPrice !== null && finalPrice !== undefined ? finalPrice : ''}" 
                       placeholder="${hasPrice && minP ? minP : 'Enter your selling price in ₹'}" 
                       min="10" step="10"
                       class="w-full pl-9 pr-3 py-3 text-lg font-black text-stone-900 rounded-2xl border-2 border-stone-300 focus:border-amber-700 focus:outline-none">
              </div>
              <p class="text-[10px] text-stone-400 mt-1">You retain 100% control over your final price. Adjust anytime.</p>
            </div>

            <!-- Original MRP (Optional for discount display) -->
            <div>
              <label class="block text-xs font-bold text-stone-700 mb-1.5">${t("originalPriceOptional")}</label>
              <div class="relative">
                <span class="absolute inset-y-0 left-0 pl-3.5 flex items-center text-sm font-bold text-stone-400 pointer-events-none">₹</span>
                <input type="number" id="input-original-price" 
                       value="${originalMarketValue !== null && originalMarketValue !== undefined ? originalMarketValue : ''}" 
                       placeholder="MRP (optional)" 
                       min="10"
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
    const btnEnhanceStaged = document.getElementById("btn-enhance-staged");
    const btnClearPhotos = document.getElementById("btn-clear-photos");

    if (btnCam && camInput) btnCam.onclick = () => camInput.click();
    if (btnGal && galInput) btnGal.onclick = () => galInput.click();

    if (btnEnhanceStaged) {
      btnEnhanceStaged.onclick = async () => {
        if (stagedFiles.length === 0) {
          showToast("Please select at least 1 photo.", "warning");
          return;
        }
        await processUploadedImages(stagedFiles);
      };
    }

    if (btnClearPhotos) {
      btnClearPhotos.onclick = () => {
        stagedFiles = [];
        render();
      };
    }

    container.querySelectorAll(".btn-remove-photo").forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const removeIdx = parseInt(btn.getAttribute("data-remove-index"), 10);
        if (!isNaN(removeIdx) && removeIdx >= 0 && removeIdx < stagedFiles.length) {
          stagedFiles.splice(removeIdx, 1);
          render();
        }
      };
    });

    container.querySelectorAll(".btn-slot-trigger").forEach(slot => {
      slot.onclick = () => {
        if (galInput) galInput.click();
      };
    });

    if (camInput) {
      camInput.onchange = (e) => {
        const file = e.target.files && e.target.files[0];
        if (file) {
          if (stagedFiles.length >= 3) {
            showToast("Maximum 3 photos allowed.", "warning");
          } else {
            stagedFiles.push(file);
            render();
          }
        }
        e.target.value = "";
      };
    }

    if (galInput) {
      galInput.onchange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;
        const remainingSlots = Math.max(0, 3 - stagedFiles.length);
        if (remainingSlots <= 0) {
          showToast("Maximum 3 photos already selected.", "warning");
          e.target.value = "";
          return;
        }
        if (files.length > remainingSlots) {
          showToast(`Maximum 3 photos allowed. Added first ${remainingSlots} photo(s).`, "warning");
        }
        const toAdd = files.slice(0, remainingSlots);
        stagedFiles = [...stagedFiles, ...toAdd];
        e.target.value = "";
        render();
      };
    }

    // Sample buttons
    container.querySelectorAll(".sample-craft-btn").forEach(btn => {
      btn.addEventListener("click", async () => {
        const isMulti = btn.getAttribute("data-sample-multi") === "true";
        if (isMulti) {
          const urls = (btn.getAttribute("data-sample-urls") || "").split(",").filter(Boolean);
          try {
            showToast(`Loading ${urls.length} sample craft photos...`, "info");
            const files = await Promise.all(urls.map(async (url, idx) => {
              const res = await fetch(url);
              const blob = await res.blob();
              return new File([blob], `sample_photo_${idx + 1}.jpg`, { type: "image/jpeg" });
            }));
            await processUploadedImages(files);
          } catch (err) {
            showToast(err.message, "error");
          }
          return;
        }

        const sampleUrl = btn.getAttribute("data-sample-url");
        const sampleName = btn.getAttribute("data-sample-name");
        try {
          showToast("Loading sample craft photo...", "info");
          // Fetch the image as a Blob to simulate upload
          const res = await fetch(sampleUrl);
          const blob = await res.blob();
          const file = new File([blob], sampleName, { type: "image/jpeg" });
          await processUploadedImages([file]);
        } catch (err) {
          showToast(err.message, "error");
        }
      });
    });

    // Step 2: Slider & Multi-Photo switching logic
    if (currentStep === 2) {
      setupComparisonSlider();

      container.querySelectorAll(".photo-selector-tab").forEach(tab => {
        tab.addEventListener("click", () => {
          const idx = parseInt(tab.getAttribute("data-photo-index"), 10);
          if (!isNaN(idx) && idx !== activePhotoIndex) {
            activePhotoIndex = idx;
            render();
          }
        });
      });

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
        btnConfirmDetails.addEventListener("click", async () => {
          // Save edited values back to aiCatalogData
          if (aiCatalogData) {
            aiCatalogData.title = document.getElementById("ai-title-input")?.value.trim() || aiCatalogData.title;
            aiCatalogData.description = document.getElementById("ai-description-input")?.value.trim() || aiCatalogData.description;
            aiCatalogData.material = document.getElementById("ai-material-input")?.value.trim() || aiCatalogData.material;
            aiCatalogData.craft_details = document.getElementById("ai-technique-input")?.value.trim() || aiCatalogData.craft_details;

            const hasValidPrice = Boolean(aiCatalogData.price_available) && 
                                  typeof aiCatalogData.suggested_min_price === "number" && 
                                  typeof aiCatalogData.suggested_max_price === "number" && 
                                  aiCatalogData.suggested_min_price > 0;
            if (!hasValidPrice) {
              try {
                showToast("Analyzing craft attributes for initial pricing...", "info");
                const calcResp = await api.calculatePrice({
                  category: aiCatalogData.category_id || aiCatalogData.category_slug,
                  category_name: aiCatalogData.category_name,
                  title: aiCatalogData.title || aiCatalogData.name,
                  material: aiCatalogData.material,
                  craft_details: aiCatalogData.craft_details,
                  complexity_score: aiCatalogData.complexity_score || 50,
                  craftsmanship_level: aiCatalogData.craftsmanship_level || "detailed",
                  scale: "medium"
                });
                if (calcResp && calcResp.price_available) {
                  aiCatalogData.suggested_min_price = calcResp.suggested_min_price;
                  aiCatalogData.suggested_max_price = calcResp.suggested_max_price;
                  aiCatalogData.price_source = calcResp.price_source || "ai_product_analysis";
                  aiCatalogData.price_confidence = calcResp.price_confidence;
                  aiCatalogData.price_reason = calcResp.price_reason;
                  aiCatalogData.price_factors = calcResp.price_factors;
                  aiCatalogData.price_available = true;
                }
              } catch (err) {
                console.warn("Initial pricing fallback error:", err);
              }
            }

            if (Boolean(aiCatalogData.price_available) && typeof aiCatalogData.suggested_min_price === "number" && aiCatalogData.suggested_min_price > 0) {
              if (!isSellingPriceUserEdited) {
                finalPrice = Math.round(aiCatalogData.suggested_min_price);
              }
              if (!isOriginalPriceUserEdited && finalPrice) {
                originalMarketValue = Math.round(finalPrice * 1.25);
              }
            } else if (finalPrice !== null && finalPrice !== undefined && finalPrice > 0) {
              // Retain artisan's manually entered price
            } else {
              finalPrice = null;
            }
          }
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
      const btnToggleCostCalc = document.getElementById("btn-toggle-cost-calc");
      const btnApplyCosts = document.getElementById("btn-apply-costs");

      if (btnToggleCostCalc) {
        btnToggleCostCalc.addEventListener("click", () => {
          isCostCalculatorOpen = !isCostCalculatorOpen;
          render();
        });
      }

      if (btnApplyCosts) {
        btnApplyCosts.addEventListener("click", async () => {
          const matVal = parseFloat(document.getElementById("input-cost-material")?.value);
          const labVal = parseFloat(document.getElementById("input-cost-labor")?.value);
          const othVal = parseFloat(document.getElementById("input-cost-other")?.value);

          sellerCostMaterial = isNaN(matVal) ? "" : matVal;
          sellerCostLabor = isNaN(labVal) ? "" : labVal;
          sellerCostOther = isNaN(othVal) ? "" : othVal;

          try {
            showToast("Calculating artisan cost-plus pricing...", "info");
            // Preserve initial AI recommendation before refining with costs
            if (aiCatalogData && !aiCatalogData.initial_price && aiCatalogData.suggested_min_price) {
              aiCatalogData.initial_price = {
                min: aiCatalogData.suggested_min_price,
                max: aiCatalogData.suggested_max_price,
                source: aiCatalogData.price_source,
                confidence: aiCatalogData.price_confidence,
                reason: aiCatalogData.price_reason,
                factors: aiCatalogData.price_factors
              };
            }

            const priceResp = await api.calculatePrice({
              category: aiCatalogData?.category_id || aiCatalogData?.category_slug,
              category_name: aiCatalogData?.category_name,
              material: aiCatalogData?.material,
              title: aiCatalogData?.title || aiCatalogData?.name,
              complexity_score: aiCatalogData?.complexity_score || 50,
              craftsmanship_level: aiCatalogData?.craftsmanship_level || "detailed",
              scale: "medium",
              material_cost: isNaN(matVal) ? null : matVal,
              labor_cost: isNaN(labVal) ? null : labVal,
              other_cost: isNaN(othVal) ? null : othVal
            });

            if (priceResp && priceResp.price_available) {
              aiCatalogData.suggested_min_price = priceResp.suggested_min_price;
              aiCatalogData.suggested_max_price = priceResp.suggested_max_price;
              aiCatalogData.price_source = priceResp.price_source || "seller_costs";
              aiCatalogData.price_confidence = priceResp.price_confidence;
              aiCatalogData.price_reason = priceResp.price_reason;
              aiCatalogData.price_factors = priceResp.price_factors;
              aiCatalogData.price_available = true;

              if (!isSellingPriceUserEdited) {
                finalPrice = Math.round(priceResp.suggested_min_price);
              }
              if (!isOriginalPriceUserEdited) {
                originalMarketValue = Math.round(priceResp.suggested_min_price * 1.25);
              }
              showToast("Price refined from your actual production costs!", "success");
              render();
            }
          } catch (err) {
            showToast(err.message || "Could not calculate custom cost pricing", "error");
          }
        });
      }

      const btnResetInitial = document.getElementById("btn-reset-initial-price");
      if (btnResetInitial && aiCatalogData && aiCatalogData.initial_price) {
        btnResetInitial.addEventListener("click", () => {
          aiCatalogData.suggested_min_price = aiCatalogData.initial_price.min;
          aiCatalogData.suggested_max_price = aiCatalogData.initial_price.max;
          aiCatalogData.price_source = aiCatalogData.initial_price.source;
          aiCatalogData.price_confidence = aiCatalogData.initial_price.confidence;
          aiCatalogData.price_reason = aiCatalogData.initial_price.reason;
          aiCatalogData.price_factors = aiCatalogData.initial_price.factors;
          if (!isSellingPriceUserEdited) {
            finalPrice = Math.round(aiCatalogData.initial_price.min);
          }
          if (!isOriginalPriceUserEdited) {
            originalMarketValue = Math.round(aiCatalogData.initial_price.min * 1.25);
          }
          sellerCostMaterial = "";
          sellerCostLabor = "";
          sellerCostOther = "";
          showToast("Reverted to initial AI product recommendation", "info");
          render();
        });
      }

      if (priceInput) {
        priceInput.addEventListener("input", () => {
          const val = parseFloat(priceInput.value);
          if (!isNaN(val) && val > 0) {
            finalPrice = val;
            isSellingPriceUserEdited = true;
          } else {
            finalPrice = null;
            if (priceInput.value.trim() === "") {
              isSellingPriceUserEdited = true;
            }
          }
        });
      }

      if (origPriceInput) {
        origPriceInput.addEventListener("input", () => {
          const val = parseFloat(origPriceInput.value);
          if (!isNaN(val) && val > 0) {
            originalMarketValue = val;
            isOriginalPriceUserEdited = true;
          } else {
            originalMarketValue = null;
            if (origPriceInput.value.trim() === "") {
              isOriginalPriceUserEdited = true;
            }
          }
        });
      }

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
          const origPriceVal = origPriceInput ? origPriceInput.value.trim() : "";
          const origPrice = origPriceVal !== "" && !isNaN(parseFloat(origPriceVal)) ? parseFloat(origPriceVal) : null;
          const quantity = parseInt(qtyInput.value) || 1;

          if (isNaN(price) || !price || price <= 0) {
            showToast("Please enter a fair selling price for your craft", "error");
            priceInput.focus();
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
              all_images: (enhancementData.image_enhancements || [enhancementData.image_enhancement]).map(e => ({
                original_url: e.original_url,
                enhanced_url: e.enhanced_url,
                background_color: e.solid_background_color
              })),
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

  async function processUploadedImages(files) {
    if (!api.token) {
      showToast(t("loginRequiredArtisan"), "info");
      window.app.navigate("auth", { mode: "login" });
      return;
    }

    if (!files || files.length === 0) {
      showToast("Please select at least 1 photo.", "warning");
      return;
    }

    // Limit strictly to 1 to 3 photos
    if (files.length > 3) {
      showToast("Maximum 3 photos allowed. First 3 photos selected.", "warning");
      files = files.slice(0, 3);
    }

    // Reset previous AI state to guarantee clean request isolation
    selectedFiles = files;
    selectedFile = files[0];
    activePhotoIndex = 0;
    enhancementData = null;
    aiCatalogData = null;
    finalPrice = null;
    originalMarketValue = null;
    isSellingPriceUserEdited = false;
    isOriginalPriceUserEdited = false;
    sellerCostMaterial = "";
    sellerCostLabor = "";
    sellerCostOther = "";
    isCostCalculatorOpen = false;

    try {
      const countLabel = files.length > 1 ? `${files.length} Photos` : "Your Photo";
      showLoadingModal(`AI Enhancing ${countLabel}...`, "Isolating product subjects, enhancing studio lighting, and preparing clean solid backgrounds...");
      const formData = new FormData();
      files.forEach(f => {
        formData.append("files", f);
      });
      formData.append("file", files[0]);
      formData.append("language", currentLanguage);

      const res = await api.uploadAndEnhance(formData);
      enhancementData = res;
      aiCatalogData = res.ai_catalog;
      if (res.ai_catalog && typeof res.ai_catalog.suggested_min_price === "number") {
        finalPrice = Math.round(res.ai_catalog.suggested_min_price);
        originalMarketValue = Math.round(finalPrice * 1.25);
      } else {
        finalPrice = null;
        originalMarketValue = null;
      }

      hideLoadingModal();
      currentStep = 2;
      render();
    } catch (err) {
      hideLoadingModal();
      showToast(err.message, "error");
    }
  }

  async function processUploadedImage(file) {
    return await processUploadedImages([file]);
  }

  function setupComparisonSlider() {
    const container = document.getElementById("slider-container");
    const overlay = document.getElementById("slider-overlay");
    const divider = document.getElementById("slider-divider");
    const imgOriginal = document.getElementById("img-original");
    const imgEnhanced = document.getElementById("img-enhanced");
    if (!container || !overlay || !divider) return;

    // Ensure inner img width matches container width
    const updateDimensions = () => {
      const w = container.offsetWidth;
      const h = container.offsetHeight;
      if (imgOriginal && w > 0) {
        imgOriginal.style.width = `${w}px`;
        imgOriginal.style.height = `${h}px`;
      }
    };
    updateDimensions();

    if (window.ResizeObserver) {
      const ro = new ResizeObserver(updateDimensions);
      ro.observe(container);
    }
    if (imgEnhanced) imgEnhanced.onload = updateDimensions;
    if (imgOriginal) imgOriginal.onload = updateDimensions;

    let isDragging = false;

    const moveSlider = (clientX) => {
      const rect = container.getBoundingClientRect();
      let x = clientX - rect.left;
      x = Math.max(0, Math.min(x, rect.width));
      const percentage = (x / rect.width) * 100;

      overlay.style.width = `${percentage}%`;
      divider.style.left = `${percentage}%`;
    };

    // Click anywhere on container to move slider
    container.addEventListener("click", (e) => {
      moveSlider(e.clientX);
    });

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
