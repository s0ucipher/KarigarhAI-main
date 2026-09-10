// KalaSetu AI Internationalization (i18n)
// Comprehensive translations for English (en), Hindi (hi), and Bengali (bn)

const translations = {
  en: {
    appName: "KalaSetu AI",
    appTagline: "Bridging Artisan Craft with Modern E-Commerce",
    
    // Auth
    welcome: "Welcome to KalaSetu AI",
    welcomeSub: "Empowering local artisans & connecting conscious buyers",
    login: "Login",
    signup: "Register",
    logout: "Logout",
    email: "Email Address",
    password: "Password",
    fullName: "Full Name",
    phone: "Phone Number",
    role: "I want to join as:",
    roleSeller: "Artisan / Craftsman (Seller)",
    roleBuyer: "Customer / Supporter (Buyer)",
    craftSpecialization: "Your Craft Specialization (e.g. Terracotta, Weaving)",
    location: "Artisan Village / City (e.g. Bishnupur, Jaipur)",
    storyBio: "Tell buyers about your craft tradition",
    forgotPassword: "Forgot Password?",
    resetPassword: "Reset Password",
    newPassword: "New Password",
    alreadyHaveAccount: "Already have an account? Log in",
    dontHaveAccount: "Don't have an account? Register now",
    switchRole: "Switch Mode",
    switchToBuyer: "Switch to Buyer",
    switchToSeller: "Switch to Seller",
    guestDemo: "Quick Demo Logins",
    loginRequiredCart: "Please log in to add items to your cart.",
    loginRequiredOrder: "Please log in to place your order.",
    loginRequiredNotifications: "Please log in to view notifications.",
    loginRequiredArtisan: "Please log in as an artisan to use this feature.",
    switchAccount: "Please sign out, then log in with the account you want to use.",
    back: "Back",

    // Navigation
    navHome: "Home",
    navMarketplace: "Marketplace",
    navMyProducts: "My Crafts",
    navAddProduct: "Add Craft",
    navOrders: "Orders",
    navCart: "Cart",
    navProfile: "Profile",
    navNotifications: "Alerts",

    // Seller Dashboard
    artisanDashboard: "Artisan Studio Dashboard",
    helloArtisan: "Namaste, Artisan",
    quickActions: "Quick Actions",
    btnAddNewCraft: "📸 Add New Craft (AI Photo)",
    btnViewOrders: "📦 Manage Orders",
    btnViewEarnings: "💰 View Earnings",
    totalEarnings: "Total Earnings",
    activeOrders: "Orders to Ship",
    totalCrafts: "Total Crafts Listed",
    verifiedArtisan: "Verified Artisan",
    recentOrders: "Recent Orders to Ship",
    myListedCrafts: "My Listed Crafts",
    stockAvailable: "In Stock",
    outOfStock: "Sold Out",
    editProduct: "Edit Craft",
    deleteProduct: "Remove",

    // AI Listing Wizard
    wizardTitle: "List a Craft with AI",
    step1Title: "1. Upload Product Photos (1 to 5 Photos)",
    step1Sub: "Upload 1 to 5 clear photos of your handmade craft (front, side, and detail angles).",
    btnCapturePhoto: "Take Photo",
    btnUploadPhoto: "Upload Photos (1–5)",
    multiPhotoBadge: "Multiple Photo Upload (1–5 Photos)",
    orPickSample: "Or select a sample craft to test:",
    sampleVase: "Terracotta Vase",
    sampleHorse: "Bankura Horse",
    samplePainting: "Madhubani Art",
    sampleBrass: "Dhokra Figurine",
    
    step2Title: "2. AI Enhancing Your Photo...",
    step2Sub: "Enhancing lighting, sharpening textures, and creating studio background...",
    sliderBefore: "Original Photo",
    sliderAfter: "AI Enhanced Studio",
    metricsLighting: "Lighting Boost",
    metricsSharpness: "Texture Sharpness",
    metricsStudio: "Marketplace Grade",

    step3Title: "3. Review AI-Generated Details",
    step3Sub: "Our AI analyzed your craft and wrote professional marketplace details.",
    craftName: "Craft Name",
    craftTitle: "Marketplace Title",
    craftCategory: "Category",
    craftDescription: "Story & Description",
    craftMaterial: "Materials Used",
    craftTechnique: "Handmade Technique",
    craftTags: "Search Tags",
    btnRegenerate: "🔄 Re-write with AI",

    step4Title: "4. Set Your Price & Quantity",
    step4Sub: "You have complete control over your earnings.",
    aiPriceSuggestion: "AI Recommended Price Range:",
    sellingPrice: "Your Selling Price (₹)",
    originalPriceOptional: "Original Market Value (₹ - Optional)",
    quantityInStock: "Number of Items in Stock",

    step5Title: "5. Ready to Publish!",
    btnPublishProduct: "✨ Publish Craft Now",
    listingSuccess: "Congratulations! Your craft is now live on the marketplace.",

    // Voice Help
    listenInstructions: "🔊 Listen in Audio",

    // Buyer Marketplace
    discoverCrafts: "Discover Authentic Indian Handicrafts",
    searchPlaceholder: "Search handmade pottery, silk, brass art...",
    allCategories: "All Crafts",
    featuredArtisans: "Featured Master Artisans",
    viewArtisanProfile: "Meet the Artisan",
    freeDeliveryTag: "Free Delivery above ₹999",
    addToCart: "Add to Cart",
    buyNow: "Buy Now",
    craftDetails: "Craft Heritage & Details",
    craftsmanStory: "About the Craftsman",
    materials: "Materials",
    origin: "Origin",
    similarRecommendations: "You May Also Like",

    // Cart & Checkout
    shoppingCart: "Your Shopping Cart",
    emptyCart: "Your cart is empty. Explore authentic crafts!",
    subtotal: "Subtotal",
    deliveryFee: "Delivery Fee",
    free: "FREE",
    totalAmount: "Total Payable",
    proceedToCheckout: "Proceed to Checkout",
    deliveryAddress: "Delivery Address",
    streetAddress: "House / Flat No., Street, Area",
    city: "City",
    state: "State",
    pincode: "PIN Code",
    paymentMethod: "Payment Method",
    cod: "Cash on Delivery",
    upi: "UPI / QR Code",
    card: "Debit / Credit Card",
    placeOrder: "Confirm & Place Order",
    orderSuccess: "Order Placed Successfully!",

    // Order Tracking & Statuses
    orderStatus_order_placed: "Order Placed",
    orderStatus_accepted: "Accepted by Artisan",
    orderStatus_processing: "Handcrafting & Packing",
    orderStatus_shipped: "Shipped",
    orderStatus_out_for_delivery: "Out for Delivery",
    orderStatus_delivered: "Delivered",
    orderStatus_cancelled: "Cancelled",

    orderTracking: "Order Tracking",
    orderNumber: "Order #",
    placedOn: "Placed on",
    buyerInfo: "Buyer Contact & Address",
    updateStatus: "Update Order Status",
    btnAcceptOrder: "Accept Order",
    btnMarkProcessing: "Start Packing",
    btnMarkShipped: "Ship Order",
    btnMarkDelivered: "Mark as Delivered",
    noOrdersYet: "No orders found yet.",

    // Notifications
    markAllRead: "Mark all as read",
    noNotifications: "No new notifications.",

    // Simulator
    simulatorToggle: "Toggle Mobile Frame",
    langEn: "English",
    langHi: "हिन्दी",
    langBn: "বাংলা"
  },

  hi: {
    appName: "KalaSetu AI",
    appTagline: "भारतीय शिल्प और आधुनिक ई-कॉमर्स का संगम",
    
    // Auth
    welcome: "कारीगर सेतु में आपका स्वागत है",
    welcomeSub: "स्थानीय कारीगरों को सशक्त और ग्राहकों को सीधे जोड़ने वाला मंच",
    login: "लॉग इन करें",
    signup: "पंजीकरण करें",
    logout: "लॉग आउट",
    email: "ईमेल पता",
    password: "पासवर्ड",
    fullName: "पूरा नाम",
    phone: "फ़ोन नंबर",
    role: "आप किस रूप में जुड़ना चाहते हैं:",
    roleSeller: "कारीगर / शिल्पी (विक्रेता)",
    roleBuyer: "ग्राहक / खरीदार (कस्टमर)",
    craftSpecialization: "आपकी शिल्प कला (जैसे: मिट्टी के बर्तन, हथकरघा)",
    location: "आपका गाँव या शहर (जैसे: बिष्णुपुर, जयपुर)",
    storyBio: "अपनी कला परंपरा के बारे में बताएं",
    forgotPassword: "पासवर्ड भूल गए?",
    resetPassword: "पासवर्ड रीसेट करें",
    newPassword: "नया पासवर्ड",
    alreadyHaveAccount: "पहले से खाता है? लॉग इन करें",
    dontHaveAccount: "खाता नहीं है? पंजीकरण करें",
    switchRole: "मोड बदलें",
    switchToBuyer: "खरीदार मोड पर जाएं",
    switchToSeller: "कारीगर मोड पर जाएं",
    guestDemo: "त्वरित डेमो लॉगिन",
    loginRequiredCart: "कार्ट में आइटम जोड़ने के लिए कृपया लॉग इन करें।",
    loginRequiredOrder: "ऑर्डर देने के लिए कृपया लॉग इन करें।",
    loginRequiredNotifications: "सूचनाएं देखने के लिए कृपया लॉग इन करें।",
    loginRequiredArtisan: "इस सुविधा का उपयोग करने के लिए कारीगर के रूप में लॉग इन करें।",
    switchAccount: "कृपया लॉग आउट करें, फिर जिस खाते का उपयोग करना है उससे लॉग इन करें।",
    back: "वापस जाएं",

    // Navigation
    navHome: "होम",
    navMarketplace: "बाज़ार",
    navMyProducts: "मेरे उत्पाद",
    navAddProduct: "नया शिल्प जोड़ें",
    navOrders: "आर्डर",
    navCart: "टोकरी (कार्ट)",
    navProfile: "प्रोफ़ाइल",
    navNotifications: "सूचनाएं",

    // Seller Dashboard
    artisanDashboard: "कारीगर स्टूडियो डैशबोर्ड",
    helloArtisan: "नमस्ते, कारीगर जी",
    quickActions: "त्वरित कार्य",
    btnAddNewCraft: "📸 नया उत्पाद जोड़ें (AI कैमरा)",
    btnViewOrders: "📦 आर्डर देखें व भेजें",
    btnViewEarnings: "💰 कमाई देखें",
    totalEarnings: "कुल कमाई",
    activeOrders: "भेजने हेतु आर्डर",
    totalCrafts: "कुल सूचीबद्ध शिल्प",
    verifiedArtisan: "सत्यापित कारीगर",
    recentOrders: "नए आर्डर",
    myListedCrafts: "मेरी कलाकृतियां",
    stockAvailable: "उपलब्ध",
    outOfStock: "समाप्त",
    editProduct: "संशोधित करें",
    deleteProduct: "हटाएं",

    // AI Listing Wizard
    wizardTitle: "AI से उत्पाद सूचीबद्ध करें",
    step1Title: "1. उत्पाद फ़ोटो अपलोड करें (1 से 5 फ़ोटो)",
    step1Sub: "अपने हस्तशिल्प की 1 से 5 साफ़ तस्वीरें अपलोड करें (सामने, बाजू और विवरण कोण)।",
    btnCapturePhoto: "कैमरा खोलें",
    btnUploadPhoto: "फ़ोटो अपलोड करें (1-5)",
    multiPhotoBadge: "मल्टीपल फ़ोटो अपलोड (1 से 5 फ़ोटो)",
    orPickSample: "या परीक्षण के लिए नमूना शिल्प चुनें:",
    sampleVase: "मिट्टी का फूलदान",
    sampleHorse: "बांकुरा घोड़ा",
    samplePainting: "मधुबनी पेंटिंग",
    sampleBrass: "ढोकरा मूर्ति",
    
    step2Title: "2. AI आपकी फोटो सुधार रहा है...",
    step2Sub: "रोशनी, प्राकृतिक रंग और स्टूडियो बैकग्राउंड तैयार किया जा रहा है...",
    sliderBefore: "मूल फोटो",
    sliderAfter: "AI स्टूडियो फोटो",
    metricsLighting: "रोशनी सुधार",
    metricsSharpness: "बारीकी और स्पष्टता",
    metricsStudio: "मार्केटप्लेस ग्रेड",

    step3Title: "3. AI द्वारा तैयार विवरण देखें",
    step3Sub: "AI ने आपके शिल्प की पहचान कर सुंदर और पेशेवर विवरण लिखा है।",
    craftName: "उत्पाद का नाम",
    craftTitle: "बाज़ार शीर्षक",
    craftCategory: "श्रेणी",
    craftDescription: "शिल्प कथा एवं विवरण",
    craftMaterial: "प्रयुक्त सामग्री",
    craftTechnique: "निर्माण तकनीक",
    craftTags: "टैग्स",
    btnRegenerate: "🔄 AI से पुनः लिखवाएं",

    step4Title: "4. अपना मूल्य और संख्या तय करें",
    step4Sub: "अपनी कला की कीमत तय करने का पूरा अधिकार आपका है।",
    aiPriceSuggestion: "AI द्वारा सुझाई गई उचित कीमत:",
    sellingPrice: "आपका विक्रय मूल्य (₹)",
    originalPriceOptional: "बाजार मूल्य (₹ - वैकल्पिक)",
    quantityInStock: "उपलब्ध मात्रा (स्टॉक)",

    step5Title: "5. प्रकाशित करने के लिए तैयार!",
    btnPublishProduct: "✨ अभी बाज़ार में प्रकाशित करें",
    listingSuccess: "बधाई हो! आपकी कलाकृति अब लाखों ग्राहकों के देखने हेतु उपलब्ध है।",

    // Voice Help
    listenInstructions: "🔊 आवाज में सुनें",

    // Buyer Marketplace
    discoverCrafts: "प्रामाणिक भारतीय हस्तशिल्प खोजें",
    searchPlaceholder: "मिट्टी के बर्तन, रेशमी वस्त्र, पीतल शिल्प खोजें...",
    allCategories: "सभी श्रेणियां",
    featuredArtisans: "प्रमुख उस्ताद कारीगर",
    viewArtisanProfile: "कारीगर से मिलें",
    freeDeliveryTag: "₹999 से अधिक पर मुफ़्त डिलीवरी",
    addToCart: "कार्ट में जोड़ें",
    buyNow: "अभी खरीदें",
    craftDetails: "शिल्प की विशेषताएं",
    craftsmanStory: "कारीगर की कहानी",
    materials: "सामग्री",
    origin: "स्थान",
    similarRecommendations: "आपको यह भी पसंद आ सकता है",

    // Cart & Checkout
    shoppingCart: "आपकी खरीदारी की टोकरी",
    emptyCart: "आपकी कार्ट खाली है। हस्तनिर्मित शिल्प देखें!",
    subtotal: "उप-कुल",
    deliveryFee: "डिलीवरी शुल्क",
    free: "मुफ़्त",
    totalAmount: "कुल देय राशि",
    proceedToCheckout: "चेकआउट करें",
    deliveryAddress: "डिलीवरी का पता",
    streetAddress: "मकान/फ्लैट नं, सड़क, इलाका",
    city: "शहर",
    state: "राज्य",
    pincode: "पिन कोड",
    paymentMethod: "भुगतान का माध्यम",
    cod: "कैश ऑन डिलीवरी (सामान मिलने पर नकद)",
    upi: "UPI / क्यूआर कोड",
    card: "डेबिट / क्रेडिट कार्ड",
    placeOrder: "आर्डर की पुष्टि करें",
    orderSuccess: "आर्डर सफलतापूर्वक दर्ज हुआ!",

    // Order Tracking & Statuses
    orderStatus_order_placed: "आर्डर दर्ज हुआ",
    orderStatus_accepted: "कारीगर ने स्वीकार किया",
    orderStatus_processing: "हस्तकला व पैकिंग जारी",
    orderStatus_shipped: "भेज दिया गया (Shipped)",
    orderStatus_out_for_delivery: "डिलीवरी के लिए निकला",
    orderStatus_delivered: "सफलतापूर्वक वितरित",
    orderStatus_cancelled: "रद्द किया गया",

    orderTracking: "आर्डर ट्रैकिंग",
    orderNumber: "आर्डर संख्या",
    placedOn: "आर्डर तिथि",
    buyerInfo: "खरीदार का पता व फ़ोन",
    updateStatus: "स्थिति बदलें",
    btnAcceptOrder: "आर्डर स्वीकार करें",
    btnMarkProcessing: "पैकिंग शुरू करें",
    btnMarkShipped: "डिस्पैच करें",
    btnMarkDelivered: "सफलतापूर्वक वितरित चिह्नित करें",
    noOrdersYet: "अभी तक कोई आर्डर नहीं मिला है।",

    // Notifications
    markAllRead: "सभी पढ़ी हुई चिह्नित करें",
    noNotifications: "कोई नई सूचना नहीं है।",

    simulatorToggle: "मोबाइल फ्रेम बदलें",
    langEn: "English",
    langHi: "हिन्दी",
    langBn: "বাংলা"
  },

  bn: {
    appName: "KalaSetu AI",
    appTagline: "হস্তশিল্প ও আধুনিক ই-কমার্সের মেলবন্ধন",
    
    // Auth
    welcome: "কারিগর সেতুতে স্বাগতম",
    welcomeSub: "স্থানীয় কারিগরদের ডিজিটাল ক্ষমতায়ন ও সরাসরি বাজার সংযোগ",
    login: "লগ ইন",
    signup: "নিবন্ধন করুন",
    logout: "লগ আউট",
    email: "ইমেল ঠিকানা",
    password: "পাসওয়ার্ড",
    fullName: "পুরো নাম",
    phone: "ফোন নম্বর",
    role: "আপনি কীভাবে যুক্ত হতে চান:",
    roleSeller: "কারিগর / শিল্পী (বিক্রেতা)",
    roleBuyer: "ক্রেতা / শিল্পপ্রেমী (গ্রাহক)",
    craftSpecialization: "আপনার হস্তশিল্পের ধরন (যেমন: পোড়ামাটির কাজ, তাঁত)",
    location: "আপনার গ্রাম বা শহর (যেমন: বিষ্ণুপুর, শান্তিনিকেতন)",
    storyBio: "আপনার শিল্প ঐতিহ্যের পরিচয় দিন",
    forgotPassword: "পাসওয়ার্ড ভুলে গেছেন?",
    resetPassword: "পাসওয়ার্ড রিসেট",
    newPassword: "নতুন পাসওয়ার্ড",
    alreadyHaveAccount: "ইতিমধ্যে অ্যাকাউন্ট আছে? লগ ইন করুন",
    dontHaveAccount: "অ্যাকাউন্ট নেই? নতুন অ্যাকাউন্ট খুলুন",
    switchRole: "মোড পরিবর্তন",
    switchToBuyer: "ক্রেতা মোডে যান",
    switchToSeller: "কারিগর মোডে যান",
    guestDemo: "কুইক ডেমো লগইন",
    loginRequiredCart: "কার্টে পণ্য যোগ করতে অনুগ্রহ করে লগ ইন করুন।",
    loginRequiredOrder: "অর্ডার করতে অনুগ্রহ করে লগ ইন করুন।",
    loginRequiredNotifications: "বিজ্ঞপ্তি দেখতে অনুগ্রহ করে লগ ইন করুন।",
    loginRequiredArtisan: "এই সুবিধাটি ব্যবহার করতে কারিগর হিসেবে লগ ইন করুন।",
    switchAccount: "অনুগ্রহ করে লগ আউট করুন, তারপর যে অ্যাকাউন্ট ব্যবহার করবেন তাতে লগ ইন করুন।",
    back: "ফিরে যান",

    // Navigation
    navHome: "হোম",
    navMarketplace: "বাজার",
    navMyProducts: "আমার শিল্পকর্ম",
    navAddProduct: "নতুন পণ্য যোগ",
    navOrders: "অর্ডারসমূহ",
    navCart: "কার্ট",
    navProfile: "প্রোফাইল",
    navNotifications: "বিজ্ঞপ্তি",

    // Seller Dashboard
    artisanDashboard: "কারিগর স্টুডিও ড্যাশবোর্ড",
    helloArtisan: "নমস্কার, শ্রদ্ধেয় কারিগর",
    quickActions: "সহজ অ্যাকশন",
    btnAddNewCraft: "📸 নতুন পণ্য তুলুন (AI ক্যামেরা)",
    btnViewOrders: "📦 অর্ডার পরিচালনা",
    btnViewEarnings: "💰 মোট আয় দেখুন",
    totalEarnings: "মোট উপার্জন",
    activeOrders: "পাঠানোর অপেক্ষায়",
    totalCrafts: "মোট তালিকাভুক্ত পণ্য",
    verifiedArtisan: "স্বীকৃত শিল্পী",
    recentOrders: "নতুন অর্ডারসমূহ",
    myListedCrafts: "আমার পণ্যসমূহ",
    stockAvailable: "মজুদ আছে",
    outOfStock: "শেষ হয়ে গেছে",
    editProduct: "সম্পাদনা",
    deleteProduct: "মুছে ফেলুন",

    // AI Listing Wizard
    wizardTitle: "AI সাহায্যে পণ্য তালিকাভুক্ত করুন",
    step1Title: "১. পণ্যের ছবি আপলোড করুন (১ থেকে ৫টি ছবি)",
    step1Sub: "আপনার হস্তশিল্পের ১ থেকে ৫টি স্পষ্ট ছবি আপলোড করুন (সামনে, পাশ এবং বিস্তারিত কোণ)।",
    btnCapturePhoto: "ক্যামেরা খুলুন",
    btnUploadPhoto: "ছবি আপলোড করুন (১-৫)",
    multiPhotoBadge: "একাধিক ছবি আপলোড (১ থেকে ৫টি ছবি)",
    orPickSample: "অথবা পরীক্ষার জন্য নমুনা শিল্প বাছুন:",
    sampleVase: "পোড়ামাটির ফুলদানি",
    sampleHorse: "বাঁকুড়ার ঘোড়া",
    samplePainting: "মধুবনী চিত্রকর্ম",
    sampleBrass: "ঢোকরা পিতল মূর্তি",
    
    step2Title: "২. AI আপনার ছবি সুন্দর করছে...",
    step2Sub: "স্বাভাবিক আলো বৃদ্ধি, ঝাপসা ভাব দূর ও স্টুডিও ব্যাকগ্রাউন্ড তৈরি হচ্ছে...",
    sliderBefore: "আসল ছবি",
    sliderAfter: "AI উন্নত স্টুডিও ছবি",
    metricsLighting: "আলোর ভারসাম্য",
    metricsSharpness: "সূক্ষ্মতা বৃদ্ধি",
    metricsStudio: "মার্কেটপ্লেস গ্রেড",

    step3Title: "৩. AI প্রস্তাবিত বিবরণ যাচাই করুন",
    step3Sub: "আমাদের কৃত্রিম বুদ্ধিমত্তা আপনার কাজের উপযুক্ত সুন্দর বিবরণ তৈরি করেছে।",
    craftName: "পণ্যের নাম",
    craftTitle: "মার্কেটপ্লেস শিরোনাম",
    craftCategory: "বিভাগ",
    craftDescription: "ঐতিহ্য ও বিস্তারিত বিবরণ",
    craftMaterial: "ব্যবহৃত উপাদান",
    craftTechnique: "হাতে তৈরির কৌশল",
    craftTags: "অনুসন্ধান ট্যাগ",
    btnRegenerate: "🔄 AI দিয়ে পুনরায় লিখুন",

    step4Title: "৪. নিজের দাম ও সংখ্যা নির্ধারণ করুন",
    step4Sub: "পণ্যের ন্যায্য মূল্য নির্ধারণের সম্পূর্ণ অধিকার আপনার।",
    aiPriceSuggestion: "AI প্রস্তাবিত উপযুক্ত মূল্য সীমা:",
    sellingPrice: "আপনার বিক্রয় মূল্য (₹)",
    originalPriceOptional: "বাজার দর (₹ - ঐচ্ছিক)",
    quantityInStock: "মজুদ পণ্যের সংখ্যা",

    step5Title: "৫. প্রকাশ করতে প্রস্তুত!",
    btnPublishProduct: "✨ এখনি বাজারে প্রকাশ করুন",
    listingSuccess: "অভিনন্দন! আপনার হস্তশিল্প এখন সারা দেশের ক্রেতাদের কাছে উন্মুক্ত।",

    // Voice Help
    listenInstructions: "🔊 বাংলায় শুনুন",

    // Buyer Marketplace
    discoverCrafts: "খাঁটি ভারতীয় হস্তশিল্প আবিষ্কার করুন",
    searchPlaceholder: "মাটির পাত্র, রেশম বস্ত্র, পিতল শিল্প খুঁজুন...",
    allCategories: "সকল বিভাগ",
    featuredArtisans: "গুণী ও অভিজ্ঞ কারিগরবৃন্দ",
    viewArtisanProfile: "শিল্পীর পরিচিতি",
    freeDeliveryTag: "₹৯৯৯ এর উপরে বিনামূল্যে ডেলিভারি",
    addToCart: "কার্টে যোগ করুন",
    buyNow: "সরাসরি কিনুন",
    craftDetails: "ঐতিহ্য ও বিবরণ",
    craftsmanStory: "শিল্পীর গল্প",
    materials: "উপাদান",
    origin: "উৎপত্তিস্থল",
    similarRecommendations: "আপনার আরও পছন্দ হতে পারে",

    // Cart & Checkout
    shoppingCart: "আপনার শপিং কার্ট",
    emptyCart: "আপনার কার্ট খালি। হস্তশিল্প ঘুরে দেখুন!",
    subtotal: "উপ-মোট",
    deliveryFee: "ডেলিভারি খরচ",
    free: "বিনামূল্যে",
    totalAmount: "সর্বমোট প্রদেয়",
    proceedToCheckout: "চেকআউট করুন",
    deliveryAddress: "ডেলিভারির ঠিকানা",
    streetAddress: "বাড়ি/ফ্ল্যাট নং, রাস্তা, এলাকা",
    city: "শহর",
    state: "রাজ্য",
    pincode: "পিন কোড",
    paymentMethod: "পেমেন্ট মাধ্যম",
    cod: "ক্যাশ অন ডেলিভারি (পণ্য হাতে পেয়ে মূল্য দিন)",
    upi: "UPI / কিউআর কোড",
    card: "ডেবিট / ক্রেডিট কার্ড",
    placeOrder: "অর্ডার নিশ্চিত করুন",
    orderSuccess: "অর্ডার সফলভাবে গৃহীত হয়েছে!",

    // Order Tracking & Statuses
    orderStatus_order_placed: "অর্ডার গৃহীত হয়েছে",
    orderStatus_accepted: "শিল্পী অর্ডার গ্রহণ করেছেন",
    orderStatus_processing: "পণ্য তৈরি ও প্যাকিং চলছে",
    orderStatus_shipped: "রওনা হয়েছে (Shipped)",
    orderStatus_out_for_delivery: "ডেলিভারির পথে",
    orderStatus_delivered: "সফলভাবে পৌঁছে দেওয়া হয়েছে",
    orderStatus_cancelled: "বাতিল করা হয়েছে",

    orderTracking: "অর্ডার ট্র্যাকিং",
    orderNumber: "অর্ডার নম্বর",
    placedOn: "অর্ডারের তারিখ",
    buyerInfo: "ক্রেতার ঠিকানা ও ফোন",
    updateStatus: "অবস্থা পরিবর্তন করুন",
    btnAcceptOrder: "অর্ডার গ্রহণ করুন",
    btnMarkProcessing: "প্যাকিং শুরু করুন",
    btnMarkShipped: "প্রেরণ করুন (Ship)",
    btnMarkDelivered: "ডেলিভারি সম্পন্ন চিহ্নিত করুন",
    noOrdersYet: "এখনও কোনো অর্ডার পাওয়া যায়নি।",

    // Notifications
    markAllRead: "সবগুলি পঠিত চিহ্নিত করুন",
    noNotifications: "কোনো নতুন বিজ্ঞপ্তি নেই।",

    simulatorToggle: "মোবাইল ফ্রেম পরিবর্তন",
    langEn: "English",
    langHi: "हिन्दी",
    langBn: "বাংলা"
  }
};

let currentLanguage = localStorage.getItem("kalasetu_lang") || "en";

function setLanguage(lang) {
  if (translations[lang]) {
    currentLanguage = lang;
    localStorage.setItem("kalasetu_lang", lang);
    document.documentElement.lang = lang;
    window.dispatchEvent(new CustomEvent("languageChanged", { detail: { lang } }));
  }
}

function t(key, defaultVal = "") {
  const dict = translations[currentLanguage] || translations.en;
  return dict[key] || translations.en[key] || defaultVal || key;
}

function speakText(text) {
  if (!('speechSynthesis' in window)) {
    alert("Audio speech synthesis is not supported on this browser.");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  if (currentLanguage === "hi") {
    utterance.lang = "hi-IN";
  } else if (currentLanguage === "bn") {
    utterance.lang = "bn-IN";
  } else {
    utterance.lang = "en-IN";
  }
  utterance.rate = 0.95;
  window.speechSynthesis.speak(utterance);
}
