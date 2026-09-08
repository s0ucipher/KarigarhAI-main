// API Client for KalaSetu AI Full-Stack Marketplace

const API_BASE = "";

class ApiClient {
  constructor() {
    this.token = localStorage.getItem("kalasetu_token") || null;

    // Safely load saved user data
    const savedUser = localStorage.getItem("kalasetu_user");

    try {
      this.user = (this.token && savedUser) ? JSON.parse(savedUser) : null;
      // A token without its user record is not a usable session. Treat it as
      // a guest rather than allowing protected screens to make requests with
      // stale credentials.
      if (!this.token || !this.user) {
        this.token = null;
        this.user = null;
        localStorage.removeItem("kalasetu_token");
        localStorage.removeItem("kalasetu_user");
      }
    } catch (error) {
      console.log("Invalid saved user data. Clearing it.");
      localStorage.removeItem("kalasetu_token");
      localStorage.removeItem("kalasetu_user");
      this.token = null;
      this.user = null;
    }
  }

  setAuth(token, user) {
    this.token = token;
    this.user = user;

    localStorage.setItem("kalasetu_token", token);
    localStorage.setItem("kalasetu_user", JSON.stringify(user));

    window.dispatchEvent(
      new CustomEvent("authChanged", {
        detail: {
          user: user,
          token: token
        }
      })
    );
  }

  clearAuth() {
    this.token = null;
    this.user = null;

    localStorage.removeItem("kalasetu_token");
    localStorage.removeItem("kalasetu_user");

    window.dispatchEvent(
      new CustomEvent("authChanged", {
        detail: {
          user: null,
          token: null
        }
      })
    );
  }

  getHeaders(isMultipart = false) {
    const headers = {};

    if (!isMultipart) {
      headers["Content-Type"] = "application/json";
    }

    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;

    const headers = {
      ...this.getHeaders(options.isMultipart),
      ...(options.headers || {})
    };

    const config = {
      ...options,
      headers
    };

    // Handle multipart/form-data requests
    if (config.isMultipart) {
      delete config.isMultipart;
    }

    // Convert normal JavaScript objects to JSON
    else if (
      config.body &&
      typeof config.body === "object" &&
      !(config.body instanceof FormData)
    ) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const response = await fetch(url, config);

      // Safely read JSON response
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        // Automatically clear invalid authentication
        if (response.status === 401) {
          if (this.token) {
            this.clearAuth();
          }
        }

        let errorMsg = "";
        if (typeof data.detail === "string" && data.detail.trim()) {
          errorMsg = data.detail.trim();
        } else if (Array.isArray(data.detail) && data.detail.length > 0) {
          errorMsg = data.detail
            .map(err => {
              const field = Array.isArray(err.loc) && err.loc.length > 0 ? err.loc[err.loc.length - 1] : "";
              const fieldLabel = (field && field !== "body") ? `${field}: ` : "";
              return `${fieldLabel}${err.msg || err.message || "Invalid value"}`;
            })
            .join("; ");
        } else if (typeof data.message === "string" && data.message.trim()) {
          errorMsg = data.message.trim();
        } else if (response.status === 400) {
          errorMsg = "Invalid request data. Please check your input.";
        } else if (response.status === 401) {
          errorMsg = "Authentication required. Please log in.";
        } else if (response.status === 403) {
          errorMsg = "Access forbidden (403).";
        } else if (response.status === 404) {
          errorMsg = "Requested resource or endpoint not found (404).";
        } else if (response.status === 500) {
          errorMsg = "Internal server error (500). Please check server logs.";
        } else if (response.status === 502 || response.status === 503 || response.status === 504) {
          errorMsg = "Server temporarily unavailable. Please try again in a few moments.";
        } else {
          errorMsg = `Request failed with status ${response.status}.`;
        }

        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.error(
        `API Error on [${options.method || "GET"}] ${endpoint}:`,
        err
      );

      if (err instanceof TypeError && (err.message || "").toLowerCase().includes("fetch")) {
        throw new Error("Unable to connect to the backend server. Please verify your internet connection.");
      }

      throw err;
    }
  }

  // =========================================================
  // AUTH ENDPOINTS
  // =========================================================

  async register(formData) {
    const res = await this.request("/api/auth/register", {
      method: "POST",
      body: formData
    });

    this.setAuth(res.access_token, res.user);

    return res;
  }

  async login(email, password) {
    const res = await this.request("/api/auth/login", {
      method: "POST",
      body: {
        email: email,
        password: password
      }
    });

    this.setAuth(res.access_token, res.user);

    return res;
  }

  async getFirebaseConfig() {
    return await this.request("/api/auth/firebase-config");
  }

  async googleLogin(idToken) {
    const res = await this.request("/api/auth/google", {
      method: "POST",
      body: {
        id_token: idToken
      }
    });

    this.setAuth(res.access_token, res.user);

    return res;
  }

  async getMe() {
    const res = await this.request("/api/auth/me");

    if (res.user) {
      this.user = res.user;

      localStorage.setItem(
        "kalasetu_user",
        JSON.stringify(res.user)
      );
    }

    return res.user;
  }

  async updateProfile(profileData) {
    return await this.request("/api/auth/profile", {
      method: "PUT",
      body: profileData
    });
  }

  async resetPassword(email, new_password) {
    return await this.request("/api/auth/reset-password", {
      method: "POST",
      body: {
        email: email,
        new_password: new_password
      }
    });
  }

  // =========================================================
  // PRODUCTS
  // =========================================================

  async getCategories() {
    return await this.request("/api/categories");
  }

  async getProducts(params = {}) {
    const searchParams = new URLSearchParams();

    if (params.q) {
      searchParams.append("q", params.q);
    }

    if (params.category) {
      searchParams.append("category", params.category);
    }

    if (params.seller_id) {
      searchParams.append("seller_id", params.seller_id);
    }

    if (params.sort) {
      searchParams.append("sort", params.sort);
    }

    const qs = searchParams.toString();

    return await this.request(
      `/api/products${qs ? `?${qs}` : ""}`
    );
  }

  async getProduct(id) {
    return await this.request(`/api/products/${id}`);
  }

  async createProduct(productData) {
    return await this.request("/api/products", {
      method: "POST",
      body: productData
    });
  }

  async updateProduct(id, productData) {
    return await this.request(`/api/products/${id}`, {
      method: "PUT",
      body: productData
    });
  }

  async deleteProduct(id) {
    return await this.request(`/api/products/${id}`, {
      method: "DELETE"
    });
  }

  // =========================================================
  // AI ASSISTANT
  // =========================================================

  async uploadAndEnhance(formData) {
    return await this.request("/api/ai/upload-and-enhance", {
      method: "POST",
      body: formData,
      isMultipart: true
    });
  }

  async regenerateAiText(imageUrl, language, hint) {
    return await this.request("/api/ai/regenerate-text", {
      method: "POST",
      body: {
        image_url: imageUrl,
        language: language,
        hint: hint
      }
    });
  }

  // =========================================================
  // CART
  // =========================================================

  async getCart() {
    return await this.request("/api/cart");
  }

  async addToCart(productId, quantity = 1) {
    return await this.request("/api/cart/add", {
      method: "POST",
      body: {
        product_id: productId,
        quantity: quantity
      }
    });
  }

  async updateCartItem(itemId, quantity) {
    return await this.request(`/api/cart/item/${itemId}`, {
      method: "PUT",
      body: {
        quantity: quantity
      }
    });
  }

  async removeCartItem(itemId) {
    return await this.request(`/api/cart/item/${itemId}`, {
      method: "DELETE"
    });
  }

  // =========================================================
  // ORDERS
  // =========================================================

  async checkout(orderData) {
    return await this.request("/api/orders/checkout", {
      method: "POST",
      body: orderData
    });
  }

  async getBuyerOrders() {
    return await this.request("/api/orders/buyer");
  }

  async getSellerOrders() {
    return await this.request("/api/orders/seller");
  }

  async getOrder(id) {
    return await this.request(`/api/orders/${id}`);
  }

  async updateOrderStatus(orderId, status) {
    return await this.request(`/api/orders/${orderId}/status`, {
      method: "PUT",
      body: {
        status: status
      }
    });
  }

  // =========================================================
  // SELLER DASHBOARD & PROFILES
  // =========================================================

  async getSellerDashboard() {
    return await this.request("/api/seller/dashboard");
  }

  async getPublicArtisan(id) {
    return await this.request(`/api/seller/artisan/${id}`);
  }

  // =========================================================
  // NOTIFICATIONS
  // =========================================================

  async getNotifications() {
    return await this.request("/api/notifications");
  }

  async markNotificationRead(id) {
    return await this.request(`/api/notifications/${id}/read`, {
      method: "PUT"
    });
  }

  async markAllNotificationsRead() {
    return await this.request("/api/notifications/read-all", {
      method: "PUT"
    });
  }
}

// =========================================================
// GLOBAL API INSTANCE
// =========================================================

const api = new ApiClient();
