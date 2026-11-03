const CART_STORAGE_KEY = "hamster_bunny_pet_shop_cart_v1";
const FAVORITES_STORAGE_KEY = "hamster_bunny_pet_shop_favorites_v1";

const defaultState = {
    activeCategoryId: null,
    currentUserId: null,
    adminLoggedIn: false,
    categories: [
        { id: "cat-hamsters", name: "Hamsters" },
        { id: "cat-food", name: "Food" },
        { id: "cat-habitats", name: "Habitats" },
        { id: "cat-accessories", name: "Accessories" },
    ],
    products: [
        {
            id: "prod-1",
            categoryId: "cat-hamsters",
            name: "Sunny Syrian Hamster",
            description: "A curious companion with a sweet personality and a fluffy coat.",
            price: 36.0,
            stock: 8,
            image:
                "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=900&q=80",
        },
        {
            id: "prod-2",
            categoryId: "cat-hamsters",
            name: "Peach Dwarf Hamster",
            description: "Tiny, playful, and full of energy for a bright little home.",
            price: 28.5,
            stock: 10,
            image:
                "https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80",
        },
        {
            id: "prod-3",
            categoryId: "cat-food",
            name: "Sunflower Seed Mix",
            description: "A crunchy and nutritious blend for healthy hamster snacking.",
            price: 12.75,
            stock: 25,
            image:
                "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=900&q=80",
        },
        {
            id: "prod-4",
            categoryId: "cat-food",
            name: "Berry Veggie Treats",
            description: "Soft bites packed with vitamins and fun, fruity flavor.",
            price: 9.5,
            stock: 17,
            image:
                "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=900&q=80",
        },
        {
            id: "prod-5",
            categoryId: "cat-habitats",
            name: "Cozy Multi-Level Habitat",
            description: "Spacious, stylish, and ideal for burrowing, climbing, and sleeping.",
            price: 74.0,
            stock: 5,
            image:
                "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
        },
        {
            id: "prod-6",
            categoryId: "cat-habitats",
            name: "Wooden Run Nest",
            description: "A warm and playful hiding place for naps and quiet moments.",
            price: 21.25,
            stock: 12,
            image:
                "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=900&q=80",
        },
        {
            id: "prod-7",
            categoryId: "cat-accessories",
            name: "Hamster Wheel Deluxe",
            description: "Smooth spinning fun with low-noise wheels for active evenings.",
            price: 18.9,
            stock: 14,
            image:
                "https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80",
        },
        {
            id: "prod-8",
            categoryId: "cat-accessories",
            name: "Bunny Soft Bedding",
            description: "Cloud-soft bedding for cozy rest and a calm, clean home.",
            price: 15.0,
            stock: 20,
            image:
                "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?auto=format&fit=crop&w=900&q=80",
        },
    ],
    users: [],
    orders: [],
    cart: [],
};

let state = null;
let favoriteIds = loadFavorites();
let showFavoritesOnly = false;

const elements = {
    categoryTabs: document.getElementById("categoryTabs"),
    productGrid: document.getElementById("productGrid"),
    cartCount: document.getElementById("cartCount"),
    cartDrawer: document.getElementById("cartDrawer"),
    cartItems: document.getElementById("cartItems"),
    cartTotal: document.getElementById("cartTotal"),
    sectionTitle: document.getElementById("sectionTitle"),
    accountButton: document.getElementById("accountButton"),
    adminButton: document.getElementById("adminButton"),
    authModal: document.getElementById("authModal"),
    checkoutModal: document.getElementById("checkoutModal"),
    adminModal: document.getElementById("adminModal"),
    overlay: document.getElementById("overlay"),
    checkoutSummary: document.getElementById("checkoutSummary"),
    checkoutAddress: document.getElementById("checkoutAddress"),
    adminContent: document.getElementById("adminContent"),
    toastContainer: document.getElementById("toastContainer"),
    clearFiltersBtn: document.getElementById("clearFiltersBtn"),
    shopNowBtn: document.getElementById("shopNowBtn"),
    featuredBtn: document.getElementById("featuredBtn"),
    productSearch: document.getElementById("productSearch"),
    productSort: document.getElementById("productSort"),
    favoritesToggle: document.getElementById("favoritesToggle"),
    favoriteCount: document.getElementById("favoriteCount"),
    resultCount: document.getElementById("resultCount"),
};

initialize();

async function initialize() {
    try {
        const sessionResponse = await fetch("/api/session");
        if (!sessionResponse.ok) throw new Error("Could not load your session.");
        const sessionData = await sessionResponse.json();
        const serverState = await loadState();
        const signedInCustomer = sessionData.user?.role === "customer"
            ? sessionData.user
            : null;
        state = {
            ...serverState,
            users: signedInCustomer ? [signedInCustomer] : [],
            currentUserId: signedInCustomer?.id || null,
            adminLoggedIn: false,
            cart: loadCart(),
        };
    } catch (error) {
        console.error("Could not load the shared shop state.", error);
        state = {
            ...JSON.parse(JSON.stringify(defaultState)),
            categories: [],
            products: [],
            users: [],
            orders: [],
            cart: loadCart(),
        };
        showToast("Shared shop data is unavailable. Start the server and reload.", "error");
    }

    if (!state.activeCategoryId && state.categories.length) {
        state.activeCategoryId = state.categories[0].id;
    }

    bindEvents();
    renderTabs();
    renderProducts();
    renderFavoritesButton();
    renderCart();
    renderAccountButton();
    renderAdminButton();
}

function bindEvents() {
    elements.categoryTabs.addEventListener("click", (event) => {
        const target = event.target.closest(".tab-btn");
        if (!target) return;
        state.activeCategoryId = target.dataset.categoryId;
        renderTabs();
        renderProducts();
    });

    document.getElementById("cartButton").addEventListener("click", () => {
        elements.cartDrawer.classList.toggle("open");
        elements.overlay.classList.toggle("hidden");
    });

    document.getElementById("closeCartBtn").addEventListener("click", closeCart);
    elements.overlay.addEventListener("click", closeCart);
    document.getElementById("clearCartBtn").addEventListener("click", clearCart);

    document.getElementById("checkoutBtn").addEventListener("click", () => {
        if (!state.cart.length) {
            showToast("Your cart is empty.", "error");
            return;
        }
        if (!state.currentUserId) {
            openAuthModal("login");
            showToast("Please log in to checkout.", "error");
            return;
        }
        openCheckoutModal();
    });

    document.getElementById("accountButton").addEventListener("click", () => {
        if (state.currentUserId) {
            fetch("/api/logout", { method: "POST" });
            state.currentUserId = null;
            state.adminLoggedIn = false;
            renderAccountButton();
            renderAdminButton();
            showToast("You have been logged out.", "success");
            return;
        }
        openAuthModal("login");
    });

    document.getElementById("adminButton").addEventListener("click", () => {
        if (state.adminLoggedIn) {
            openAdminDashboard();
            return;
        }
        openAdminDashboard();
    });

    document.getElementById("shopNowBtn").addEventListener("click", () => {
        const firstCategory = state.categories[0];
        if (firstCategory) {
            state.activeCategoryId = firstCategory.id;
            renderTabs();
            renderProducts();
        }
    });

    document.getElementById("featuredBtn").addEventListener("click", () => {
        const featured = state.products[0];
        addToCart(featured.id);
    });

    elements.clearFiltersBtn.addEventListener("click", () => {
        state.activeCategoryId = null;
        elements.productSearch.value = "";
        elements.productSort.value = "featured";
        showFavoritesOnly = false;
        renderTabs();
        renderProducts();
        renderFavoritesButton();
    });

    elements.productSearch.addEventListener("input", renderProducts);
    elements.productSort.addEventListener("change", renderProducts);
    elements.favoritesToggle.addEventListener("click", () => {
        showFavoritesOnly = !showFavoritesOnly;
        renderFavoritesButton();
        renderProducts();
    });

    document.getElementById("loginForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const email = document.getElementById("loginEmail").value.trim();
        const password = document.getElementById("loginPassword").value;
        const result = await postJson("/api/login", { email, password });
        if (!result.ok) {
            showToast(result.error, "error");
            return;
        }

        const user = result.data.user;
        updateCurrentUser(user);
        renderAccountButton();
        renderAdminButton();
        closeModal("authModal");
        showToast(`Welcome back, ${user.name}!`, "success");
    });

    document.getElementById("registerForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const name = document.getElementById("registerName").value.trim();
        const email = document.getElementById("registerEmail").value.trim();
        const password = document.getElementById("registerPassword").value.trim();
        const address = document.getElementById("registerAddress").value.trim();

        if (!name || !email || !password || !address) {
            showToast("Please fill in all fields including your delivery address.", "error");
            return;
        }

        const result = await postJson("/api/register", { name, email, password, address });
        if (!result.ok) {
            showToast(result.error, "error");
            return;
        }

        updateCurrentUser(result.data.user);
        renderAccountButton();
        renderAdminButton();
        closeModal("authModal");
        showToast("Account created! You can now shop and checkout.", "success");
    });

    document.querySelectorAll(".auth-tab").forEach((tab) => {
        tab.addEventListener("click", (event) => {
            const mode = event.currentTarget.dataset.authMode;
            openAuthModal(mode);
        });
    });

    document.querySelectorAll(".close-modal").forEach((closeButton) => {
        closeButton.addEventListener("click", () => {
            const modalName = closeButton.dataset.close;
            closeModal(modalName);
        });
    });

    document.getElementById("placeOrderBtn").addEventListener("click", async () => {
        const address = elements.checkoutAddress.value.trim();
        if (!address) {
            showToast("A delivery address is required before placing the order.", "error");
            return;
        }

        const user = getCurrentUser();
        if (!user) {
            showToast("Please log in before placing an order.", "error");
            return;
        }

        const result = await postJson("/api/orders", {
            address,
            items: state.cart.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
            })),
        });
        if (!result.ok) {
            showToast(result.error, "error");
            return;
        }

        state.orders = result.data.state.orders;
        state.products = result.data.state.products;
        state.cart = [];
        saveCart();
        renderProducts();
        renderCart();
        closeModal("checkoutModal");
        showToast("Order placed successfully!", "success");
    });

    document.addEventListener("click", (event) => {
        const favoriteButton = event.target.closest(".favorite-btn");
        if (favoriteButton) {
            toggleFavorite(favoriteButton.dataset.favoriteId);
            return;
        }

        const addButton = event.target.closest(".add-to-cart");
        if (addButton) {
            addToCart(addButton.dataset.productId);
            return;
        }

        const removeButton = event.target.closest(".remove-from-cart");
        if (removeButton) {
            removeFromCart(removeButton.dataset.productId);
            return;
        }

        const qtyButton = event.target.closest(".qty-adjust");
        if (qtyButton) {
            changeCartQuantity(qtyButton.dataset.productId, Number(qtyButton.dataset.delta));
        }
    });
}

async function loadState() {
    const response = await fetch("/api/state");
    if (!response.ok) {
        throw new Error("Failed to fetch shared shop data.");
    }
    const parsed = await response.json();
    return {
        ...JSON.parse(JSON.stringify(defaultState)),
        ...parsed,
        categories: parsed.categories || [],
        products: parsed.products || [],
        users: parsed.users || [],
        orders: parsed.orders || [],
    };
}

async function saveState() {
    try {
        const response = await fetch("/api/state", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                categories: state.categories,
                products: state.products,
                orders: state.orders,
            }),
        });

        if (!response.ok) {
            const result = await response.json();
            throw new Error(result.error || "Failed to save shared state.");
        }

        const shared = await response.json();
        state.categories = shared.categories;
        state.products = shared.products;
        state.orders = shared.orders;
    } catch (error) {
        console.error("Could not sync shared state:", error);
        showToast(error.message || "Could not save shared changes.", "error");
    }
}

async function postJson(url, payload) {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        });
        const responseText = await response.text();
        let data;
        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch {
            console.error(
                `Shop API returned a non-JSON response for ${url} (HTTP ${response.status}).`,
            );
            return {
                ok: false,
                data: {},
                error: response.status === 404
                    ? "The shop API route was not found (404). Check that Netlify routes /api/* to your Flask server."
                    : response.status === 508
                        ? "The shop API proxy is looping (HTTP 508). Set Netlify's SHOP_API_URL to your separate Flask backend URL, not your Netlify site URL, then redeploy."
                        : `The shop API returned an unexpected response (HTTP ${response.status}). Check the Flask server connection.`,
            };
        }
        if (response.status === 404) {
            return {
                ok: false,
                data,
                error: "The shop API route was not found (404). Check that Netlify routes /api/* to your Flask server.",
            };
        }
        if (response.status === 508) {
            return {
                ok: false,
                data,
                error: "The shop API proxy is looping (HTTP 508). Set Netlify's SHOP_API_URL to your separate Flask backend URL, not your Netlify site URL, then redeploy.",
            };
        }
        return {
            ok: response.ok,
            data,
            error: data.error || `The shop server returned an error (HTTP ${response.status}).`,
        };
    } catch (error) {
        console.error(`Could not reach the shop API at ${url}:`, error);
        return {
            ok: false,
            data: {},
            error: "Could not contact the shop server. Check the Netlify API proxy and Flask server URL.",
        };
    }
}

function updateCurrentUser(user) {
    state.users = state.users.filter((entry) => entry.id !== user.id);
    state.users.push(user);
    state.currentUserId = user.id;
    state.adminLoggedIn = user.role === "admin";
}

function loadCart() {
    try {
        const cart = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || "[]");
        return Array.isArray(cart) ? cart : [];
    } catch {
        return [];
    }
}

function saveCart() {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.cart));
}

function loadFavorites() {
    try {
        const favorites = JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || "[]");
        return Array.isArray(favorites) ? favorites : [];
    } catch {
        return [];
    }
}

function saveFavorites() {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favoriteIds));
}

function renderFavoritesButton() {
    favoriteIds = favoriteIds.filter((id) => state.products.some((product) => product.id === id));
    saveFavorites();
    elements.favoriteCount.textContent = String(favoriteIds.length);
    elements.favoritesToggle.setAttribute("aria-pressed", String(showFavoritesOnly));
    elements.favoritesToggle.classList.toggle("active", showFavoritesOnly);
}

function toggleFavorite(productId) {
    favoriteIds = favoriteIds.includes(productId)
        ? favoriteIds.filter((id) => id !== productId)
        : [...favoriteIds, productId];
    saveFavorites();
    renderFavoritesButton();
    renderProducts();
}

function formatMoney(amount) {
    return `MMK ${Number(amount).toFixed(2)}`;
}

function renderTabs() {
    elements.categoryTabs.innerHTML = state.categories
        .map(
            (category) => `
        <button
          class="tab-btn ${state.activeCategoryId === category.id ? "active" : ""}"
          data-category-id="${category.id}"
          type="button"
        >
          ${category.name}
        </button>
      `,
        )
        .join("");

    const activeCategory = state.categories.find((category) => category.id === state.activeCategoryId);
    elements.sectionTitle.textContent = activeCategory ? activeCategory.name : "All essentials";
}

function renderProducts() {
    const activeCategory = state.categories.find((category) => category.id === state.activeCategoryId);
    const searchTerm = elements.productSearch.value.trim().toLowerCase();
    const sortMode = elements.productSort.value;
    let products = state.products.filter((product) => {
        const category = state.categories.find((entry) => entry.id === product.categoryId);
        const matchesCategory = !activeCategory || product.categoryId === activeCategory.id;
        const searchableText = `${product.name} ${product.description} ${category?.name || ""}`.toLowerCase();
        const matchesSearch = !searchTerm || searchableText.includes(searchTerm);
        const matchesFavorites = !showFavoritesOnly || favoriteIds.includes(product.id);
        return matchesCategory && matchesSearch && matchesFavorites;
    });

    if (sortMode === "price-low") products.sort((a, b) => Number(a.price) - Number(b.price));
    if (sortMode === "price-high") products.sort((a, b) => Number(b.price) - Number(a.price));
    if (sortMode === "name") products.sort((a, b) => a.name.localeCompare(b.name));
    if (sortMode === "stock") products.sort((a, b) => Number(b.stock) - Number(a.stock));

    elements.resultCount.textContent = `${products.length} ${products.length === 1 ? "item" : "items"}`;

    if (!products.length) {
        elements.productGrid.innerHTML = `
      <div class="empty-state">
                ${showFavoritesOnly ? "No saved favorites match this view yet." : searchTerm ? "No little finds matched that search." : "No products in this category yet."}
      </div>
    `;
        return;
    }

    elements.productGrid.innerHTML = products
        .map((product) => {
            const isFavorite = favoriteIds.includes(product.id);
            const categoryName = state.categories.find((category) => category.id === product.categoryId)?.name || "Pet supplies";
            return `
        <article class="product-card">
                    <div class="product-media">
                        <img class="product-image" src="${product.image}" alt="${product.name}" loading="lazy" />
                        <span class="stock-pill ${product.stock > 0 ? "in-stock" : "out-stock"}">
                            ${product.stock > 0 ? (product.stock < 5 ? `Only ${product.stock} left` : "In stock") : "Out of stock"}
                        </span>
                        <button class="favorite-btn ${isFavorite ? "saved" : ""}" data-favorite-id="${product.id}" type="button" aria-label="${isFavorite ? "Remove from" : "Add to"} saved favorites" title="${isFavorite ? "Remove from" : "Add to"} saved favorites" aria-pressed="${isFavorite}">${isFavorite ? "♥" : "♡"}</button>
                    </div>
          <div class="product-body">
                        <span class="product-category">${categoryName}</span>
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <div class="product-footer">
                            <span class="price-tag">${formatMoney(product.price)}</span>
                            <button class="action-btn add-to-cart" data-product-id="${product.id}" type="button" ${product.stock < 1 ? "disabled" : ""}>
                                ${product.stock < 1 ? "Unavailable" : "Add to cart"}
              </button>
            </div>
          </div>
        </article>
            `;
        })
        .join("");
}

function addToCart(productId) {
    const product = getProductById(productId);
    if (!product) return;

    const existingItem = state.cart.find((item) => item.productId === productId);
    if (existingItem) {
        if (existingItem.quantity >= product.stock) {
            showToast("Maximum stock reached.", "error");
            return;
        }
        existingItem.quantity += 1;
    } else {
        state.cart.push({ productId, quantity: 1 });
    }

    saveCart();
    renderCart();
    showToast(`Added ${product.name} to cart.`, "success");
}

function removeFromCart(productId) {
    state.cart = state.cart.filter((item) => item.productId !== productId);
    saveCart();
    renderCart();
}

function clearCart() {
    if (!state.cart.length) return;
    state.cart = [];
    saveCart();
    renderCart();
    showToast("Your cart has been cleared.", "success");
}

function changeCartQuantity(productId, delta) {
    const item = state.cart.find((entry) => entry.productId === productId);
    if (!item) return;

    const product = getProductById(productId);
    const newQuantity = item.quantity + delta;

    if (newQuantity <= 0) {
        removeFromCart(productId);
        return;
    }

    if (newQuantity > product.stock) {
        showToast("Stock limit reached for this item.", "error");
        return;
    }

    item.quantity = newQuantity;
    saveCart();
    renderCart();
}

function renderCart() {
    const total = state.cart.reduce((sum, item) => {
        const product = getProductById(item.productId);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    elements.cartCount.textContent = String(
        state.cart.reduce((count, item) => count + item.quantity, 0),
    );
    elements.cartTotal.textContent = formatMoney(total);
    document.getElementById("clearCartBtn").disabled = state.cart.length === 0;

    if (!state.cart.length) {
        elements.cartItems.innerHTML = `
      <div class="empty-state">
        Your cart is empty. Start shopping for some cozy pet essentials.
      </div>
    `;
        return;
    }

    elements.cartItems.innerHTML = state.cart
        .map((item) => {
            const product = getProductById(item.productId);
            if (!product) return "";

            return `
        <div class="cart-item">
          <img src="${product.image}" alt="${product.name}" />
          <div>
            <h4>${product.name}</h4>
            <div class="cart-meta">
              <span>${formatMoney(product.price)}</span>
              <strong>${formatMoney(product.price * item.quantity)}</strong>
            </div>
            <div class="qty-controls">
              <button class="qty-adjust" data-product-id="${product.id}" data-delta="-1" type="button">-</button>
              <span>${item.quantity}</span>
              <button class="qty-adjust" data-product-id="${product.id}" data-delta="1" type="button">+</button>
            </div>
          </div>
          <button class="small-btn remove-from-cart" data-product-id="${product.id}" type="button">Remove</button>
        </div>
      `;
        })
        .join("");
}

function getCurrentUser() {
    return state.users.find((user) => user.id === state.currentUserId) || null;
}

function getProductById(productId) {
    return state.products.find((product) => product.id === productId) || null;
}

function openAuthModal(mode = "login") {
    closeCart();
    elements.authModal.classList.remove("hidden");
    elements.overlay.classList.remove("hidden");

    document.querySelectorAll(".auth-tab").forEach((tab) => {
        const isActive = tab.dataset.authMode === mode;
        tab.classList.toggle("active", isActive);
    });

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");
    loginForm.classList.toggle("active-form", mode === "login");
    registerForm.classList.toggle("active-form", mode === "register");
}

function closeModal(modalName) {
    const modal = document.getElementById(modalName);
    if (modal) {
        modal.classList.add("hidden");
    }

    const hasAnyModalOpen = !document.getElementById("authModal").classList.contains("hidden") ||
        !document.getElementById("checkoutModal").classList.contains("hidden") ||
        !document.getElementById("adminModal").classList.contains("hidden");

    if (!hasAnyModalOpen) {
        elements.overlay.classList.add("hidden");
    }
}

function closeCart() {
    elements.cartDrawer.classList.remove("open");
    elements.overlay.classList.add("hidden");
}

function openCheckoutModal() {
    const user = getCurrentUser();
    if (!user) return;

    elements.checkoutAddress.value = user.address || "";
    const subtotal = state.cart.reduce((sum, item) => {
        const product = getProductById(item.productId);
        return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    elements.checkoutSummary.innerHTML = `
    <div class="summary-row"><span>Items</span><strong>${state.cart.reduce((n, item) => n + item.quantity, 0)}</strong></div>
    <div class="summary-row"><span>Subtotal</span><strong>${formatMoney(subtotal)}</strong></div>
    <div class="summary-row"><span>Shipping</span><strong>${formatMoney(0)}</strong></div>
    <div class="summary-row"><span>Total</span><strong>${formatMoney(subtotal)}</strong></div>
  `;

    elements.checkoutModal.classList.remove("hidden");
    elements.overlay.classList.remove("hidden");
}

function renderAccountButton() {
    const user = getCurrentUser();
    elements.accountButton.textContent = user ? `Logout (${user.name.split(" ")[0]})` : "Login";
}

function renderAdminButton() {
    elements.adminButton.textContent = state.adminLoggedIn ? "Admin Panel" : "Admin";
}

function openAdminDashboard() {
    const currentUser = getCurrentUser();
    if (state.adminLoggedIn && currentUser?.role === "admin") {
        renderAdminDashboard();
    } else {
        elements.adminContent.innerHTML = `
      <div class="admin-toolbar">
        <div>
          <p class="eyebrow">Restricted area</p>
          <h3>Admin login</h3>
        </div>
      </div>
      <p>Sign in with your administrator email and password. Customer accounts cannot access the dashboard.</p>
      <form id="adminLoginForm" class="auth-form active-form">
        <label>
          Admin email
          <input id="adminLoginEmail" type="email" autocomplete="username" required />
        </label>
        <label>
          Password
          <input id="adminLoginPassword" type="password" autocomplete="current-password" required />
        </label>
        <button type="submit" class="primary-btn full-width">Log in as admin</button>
      </form>
    `;

        document.getElementById("adminLoginForm").addEventListener("submit", async (event) => {
            event.preventDefault();
            const email = document.getElementById("adminLoginEmail").value.trim();
            const password = document.getElementById("adminLoginPassword").value;
            const result = await postJson("/api/admin/login", { email, password });
            if (!result.ok) {
                showToast(result.error, "error");
                return;
            }
            let adminState;
            try {
                adminState = await loadState();
            } catch (error) {
                await fetch("/api/logout", { method: "POST" });
                showToast(error.message || "Could not load the admin dashboard.", "error");
                return;
            }
            state.categories = adminState.categories;
            state.products = adminState.products;
            state.orders = adminState.orders;
            updateCurrentUser(result.data.user);
            renderAccountButton();
            renderAdminButton();
            renderAdminDashboard();
            showToast("Admin login successful.", "success");
        });
    }

    elements.adminModal.classList.remove("hidden");
    elements.overlay.classList.remove("hidden");
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error("Failed to read selected image file."));
        reader.readAsDataURL(file);
    });
}

function chooseLocalImage() {
    return new Promise((resolve) => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = "image/*";
        input.style.display = "none";

        input.onchange = async () => {
            const file = input.files && input.files[0];
            if (!file) {
                resolve(null);
                return;
            }

            try {
                resolve(await readFileAsDataUrl(file));
            } catch (error) {
                resolve(null);
            }
        };

        document.body.appendChild(input);
        input.click();
        input.remove();
    });
}

function renderAdminDashboard() {
    const categories = state.categories;
    const products = state.products;
    const orders = state.orders;
    const adminUser = getCurrentUser();

    elements.adminContent.innerHTML = `
    <div class="admin-toolbar">
      <div>
        <p class="eyebrow">Management</p>
        <h3>Admin dashboard</h3>
      </div>
      <button id="logoutAdminBtn" class="secondary-btn" type="button">Log out</button>
    </div>

    <div class="admin-layout">
      <div class="admin-section">
        <h4>Navigation</h4>
        <div class="admin-list">
          ${categories
            .map(
                (category) => `
                <div class="admin-item">
                  <div class="admin-item-row">
                    <strong>${category.name}</strong>
                    <div class="admin-actions">
                      <button class="small-btn" type="button" data-edit-category="${category.id}">Edit</button>
                      <button class="small-btn" type="button" data-delete-category="${category.id}">Delete</button>
                    </div>
                  </div>
                </div>
              `,
            )
            .join("") || '<div class="empty-note">No categories yet.</div>'}
        </div>

        <form id="categoryForm" class="admin-form">
          <label>
            Category name
            <input id="categoryNameInput" type="text" placeholder="Add a new category" required />
          </label>
          <button class="primary-btn" type="submit">Add category</button>
        </form>
      </div>

      <div class="admin-section">
        <h4>Products</h4>
        <div class="admin-list">
          ${products
            .map(
                (product) => `
                <div class="admin-item">
                  <div class="admin-item-row">
                    <strong>${product.name}</strong>
                    <div class="admin-actions">
                      <button class="small-btn" type="button" data-edit-product="${product.id}">Edit</button>
                      <button class="small-btn" type="button" data-delete-product="${product.id}">Delete</button>
                    </div>
                  </div>
                  <small>${product.categoryId} • ${formatMoney(product.price)} • ${product.stock} in stock</small>
                </div>
              `,
            )
            .join("") || '<div class="empty-note">No products yet.</div>'}
        </div>

        <form id="productForm">
          <label>
            Product name
            <input id="productNameInput" type="text" required />
          </label>
          <label>
            Product image
            <input id="productImageInput" type="file" accept="image/*" />
          </label>
          <label>
            Description
            <textarea id="productDescriptionInput" rows="3" required></textarea>
          </label>
          <label>
            Price
            <input id="productPriceInput" type="number" min="0" step="0.01" required />
          </label>
          <label>
            Stock
            <input id="productStockInput" type="number" min="0" step="1" required />
          </label>
          <label>
            Category
            <select id="productCategoryInput">
              ${categories
            .map((category) => `<option value="${category.id}">${category.name}</option>`)
            .join("")}
            </select>
          </label>
          <button class="primary-btn" type="submit">Add product</button>
        </form>
      </div>
    </div>

        <div class="admin-section" style="margin-top: 1rem;">
            <h4>Admin account</h4>
            <form id="adminCredentialsForm" class="admin-form">
                <label>
                    Admin email
                    <input id="adminNewEmail" type="email" value="${adminUser?.email || ""}" autocomplete="off" required />
                </label>
                <label>
                    Current password
                    <input id="adminCurrentPassword" type="password" autocomplete="current-password" required />
                </label>
                <label>
                    New password
                    <input id="adminNewPassword" type="password" autocomplete="new-password" minlength="8" placeholder="Leave blank to keep current password" />
                </label>
                <button class="primary-btn" type="submit">Update admin login</button>
            </form>
        </div>

        <div class="admin-section" style="margin-top: 1rem;">
            <h4>Orders</h4>
      <div class="order-list">
        ${orders.length ? `
          <table class="orders-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Address</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${orders
                .map(
                    (order) => `
                    <tr>
                      <td>
                        ${order.userName}<br />
                        <small>${order.userEmail}</small>
                      </td>
                      <td>${order.address}</td>
                      <td>
                        ${order.items
                            .map((item) => `${item.name} x${item.quantity}`)
                            .join("<br />")}
                      </td>
                      <td>${formatMoney(order.total)}</td>
                      <td>
                        <span class="status-badge ${order.status.toLowerCase()}">${order.status}</span>
                        <div style="margin-top: 0.5rem;">
                          <button class="small-btn" type="button" data-toggle-order-status="${order.id}">
                            ${order.status === "Pending" ? "Mark as Shipped" : "Mark as Pending"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  `,
                )
                .join("")}
            </tbody>
          </table>
        ` : '<div class="empty-note">No orders yet.</div>'}
      </div>
    </div>
  `;

    document.getElementById("logoutAdminBtn").addEventListener("click", () => {
        fetch("/api/logout", { method: "POST" });
        state.adminLoggedIn = false;
        state.currentUserId = null;
        state.orders = [];
        renderAccountButton();
        renderAdminButton();
        closeModal("adminModal");
        showToast("Admin logged out.", "success");
    });

    document.getElementById("adminCredentialsForm").addEventListener("submit", async (event) => {
        event.preventDefault();
        const result = await postJson("/api/admin/credentials", {
            email: document.getElementById("adminNewEmail").value.trim(),
            currentPassword: document.getElementById("adminCurrentPassword").value,
            password: document.getElementById("adminNewPassword").value,
        });
        if (!result.ok) {
            showToast(result.error, "error");
            return;
        }

        updateCurrentUser(result.data.user);
        renderAccountButton();
        renderAdminDashboard();
        showToast("Admin login updated.", "success");
    });

    document.getElementById("categoryForm").addEventListener("submit", (event) => {
        event.preventDefault();
        const value = document.getElementById("categoryNameInput").value.trim();
        if (!value) return;

        const newCategory = {
            id: `cat-${Date.now()}`,
            name: value,
        };

        state.categories.push(newCategory);
        state.activeCategoryId = newCategory.id;
        saveState();
        renderTabs();
        renderProducts();
        renderAdminDashboard();
        showToast("Category added successfully.", "success");
    });

    document.getElementById("productForm").addEventListener("submit", async (event) => {
        event.preventDefault();

        const imageInput = document.getElementById("productImageInput");
        const selectedFile = imageInput.files && imageInput.files[0];

        let imageValue = "";
        if (selectedFile) {
            try {
                imageValue = await readFileAsDataUrl(selectedFile);
            } catch (error) {
                showToast("Could not read the selected image file.", "error");
                return;
            }
        }

        const product = {
            id: `prod-${Date.now()}`,
            categoryId: document.getElementById("productCategoryInput").value,
            name: document.getElementById("productNameInput").value.trim(),
            image: imageValue,
            description: document.getElementById("productDescriptionInput").value.trim(),
            price: Number(document.getElementById("productPriceInput").value),
            stock: Number(document.getElementById("productStockInput").value),
        };

        if (!product.name || !product.image || !product.description || Number.isNaN(product.price) || Number.isNaN(product.stock)) {
            showToast("Please complete all product fields correctly and choose an image.", "error");
            return;
        }

        state.products.push(product);
        state.activeCategoryId = product.categoryId;
        saveState();
        renderTabs();
        renderProducts();
        renderAdminDashboard();
        showToast("Product added successfully.", "success");
    });

    document.querySelectorAll("[data-edit-category]").forEach((button) => {
        button.addEventListener("click", () => {
            const categoryId = button.dataset.editCategory;
            const category = state.categories.find((item) => item.id === categoryId);
            if (!category) return;
            const updatedName = window.prompt("Edit category name:", category.name);
            if (!updatedName || !updatedName.trim()) return;
            category.name = updatedName.trim();
            saveState();
            renderTabs();
            renderAdminDashboard();
            showToast("Category updated.", "success");
        });
    });

    document.querySelectorAll("[data-delete-category]").forEach((button) => {
        button.addEventListener("click", () => {
            const categoryId = button.dataset.deleteCategory;
            const productCount = state.products.filter((product) => product.categoryId === categoryId).length;
            if (productCount > 0) {
                showToast("Remove or reassign products before deleting this category.", "error");
                return;
            }
            state.categories = state.categories.filter((category) => category.id !== categoryId);
            if (!state.categories.length) {
                state.activeCategoryId = null;
            } else if (state.activeCategoryId === categoryId) {
                state.activeCategoryId = state.categories[0].id;
            }
            saveState();
            renderTabs();
            renderProducts();
            renderAdminDashboard();
            showToast("Category deleted.", "success");
        });
    });

    document.querySelectorAll("[data-edit-product]").forEach((button) => {
        button.addEventListener("click", async () => {
            const productId = button.dataset.editProduct;
            const product = state.products.find((item) => item.id === productId);
            if (!product) return;

            const name = window.prompt("Edit product name:", product.name);
            if (name === null) return;
            product.name = name.trim() || product.name;

            const description = window.prompt("Edit description:", product.description);
            if (description === null) return;
            product.description = description.trim() || product.description;

            const priceValue = Number(window.prompt("Edit price:", product.price));
            if (!Number.isNaN(priceValue)) product.price = priceValue;

            const stockValue = Number(window.prompt("Edit stock:", product.stock));
            if (!Number.isNaN(stockValue)) product.stock = stockValue;

            const imageData = await chooseLocalImage();
            if (imageData) {
                product.image = imageData;
            }

            saveState();
            renderProducts();
            renderAdminDashboard();
            showToast("Product updated.", "success");
        });
    });

    document.querySelectorAll("[data-delete-product]").forEach((button) => {
        button.addEventListener("click", () => {
            const productId = button.dataset.deleteProduct;
            state.products = state.products.filter((product) => product.id !== productId);
            state.cart = state.cart.filter((item) => item.productId !== productId);
            saveState();
            renderProducts();
            renderCart();
            renderAdminDashboard();
            showToast("Product deleted.", "success");
        });
    });

    document.querySelectorAll("[data-toggle-order-status]").forEach((button) => {
        button.addEventListener("click", () => {
            const orderId = button.dataset.toggleOrderStatus;
            const order = state.orders.find((entry) => entry.id === orderId);
            if (!order) return;
            order.status = order.status === "Pending" ? "Shipped" : "Pending";
            saveState();
            renderAdminDashboard();
            showToast(`Order marked as ${order.status}.`, "success");
        });
    });
}

function showToast(message, type = "success") {
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.textContent = message;
    elements.toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 2200);
}

window.addEventListener("keydown", (event) => {
    if (event.key === "/" && !["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
        event.preventDefault();
        elements.productSearch.focus();
        return;
    }

    if (event.key === "Escape") {
        closeCart();
        closeModal("authModal");
        closeModal("checkoutModal");
        closeModal("adminModal");
        elements.overlay.classList.add("hidden");
    }
});
