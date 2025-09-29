// ----------------------------------------------------
// Módulo: Lógica de Listado y Filtrado de Productos
// ----------------------------------------------------

function initProductPage() {
    const { db, collection, query, where, onSnapshot, doc, runTransaction } = window;
    if (!db) {
        console.error("Error: Conexión con Firebase no iniciada.");
        document.getElementById('listing-loading-message').textContent = "Error: Conexión con Firebase no iniciada.";
        return;
    }

    const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const PRODUCTS_COLLECTION_PATH = `/artifacts/${APP_ID}/public/data/productos`;

    // --- MAPA DE IMÁGENES DE PRODUCTOS (CORREGIDO) ---
    const productImageMap = {
        "Smartphone Nova 10": "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "Auriculares Bluetooth P3": "https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "Monitor Curvo 27' Pro": "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "Jeans Slim Fit Clásicos": "https://images.pexels.com/photos/4210866/pexels-photo-4210866.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "Chaqueta de Invierno Alpina": "https://images.pexels.com/photos/5211446/pexels-photo-5211446.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "Camiseta Deportiva DRI-FIT": "https://images.pexels.com/photos/991509/pexels-photo-991509.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "Cafetera Expresso Automática": "https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "Juego de Sábanas de Lino": "https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "Aspiradora Robótica Smart": "https://images.pexels.com/photos/4009409/pexels-photo-4009409.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
        "Lámpara de Escritorio LED": "https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
    };

    const urlParams = new URLSearchParams(window.location.search);
    let currentCategory = urlParams.get('cat') || 'all';
    let currentFilters = {};
    let currentSort = 'default';
    let allProducts = [];

    const productGridEl = document.getElementById('product-listing-grid');
    const titleEl = document.getElementById('listing-title');
    const sortEl = document.getElementById('sort-by');
    const brandFilterListEl = document.getElementById('brand-filters');
    const loadingMessageEl = document.getElementById('listing-loading-message');

    // ----------------------------------------------------
    // RENDERIZADO
    // ----------------------------------------------------

    function renderProductCard(product) {
        const imageUrl = productImageMap[product.nombre] || product.image || `https://placehold.co/300x300/eee/333?text=${product.nombre.substring(0,10)}`;
        return `
            <a href="detalle.html?id=${product.id}" class="product-card-link">
                <div class="product-card">
                    <div class="product-image-container">
                        <img src="${imageUrl}" alt="${product.nombre}" onerror="this.onerror=null; this.src='https://placehold.co/300x300/888/ffffff?text=No+Image';">
                    </div>
                    <div class="product-details">
                        <h3 title="${product.nombre}">${product.nombre}</h3>
                        <p class="brand">${product.marca || 'Marca Desconocida'}</p>
                        <p class="price">$${product.precio.toFixed(2)}</p>
                        <button class="btn add-to-cart-btn" data-id="${product.id}">Añadir al Carrito</button>
                    </div>
                </div>
            </a>
        `;
    }

    function renderProducts(products) {
        if (!productGridEl) return;
        productGridEl.innerHTML = '';
        if (products.length === 0) {
            productGridEl.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; padding: 50px;">No se encontraron productos.</p>';
            if (loadingMessageEl) loadingMessageEl.style.display = 'none';
            return;
        }
        productGridEl.innerHTML = products.map(renderProductCard).join('');
        if (loadingMessageEl) loadingMessageEl.style.display = 'none';
    }

    // ----------------------------------------------------
    // LÓGICA DE CARRITO (LOCALSTORAGE)
    // ----------------------------------------------------

    const getCart = () => {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    }

    const saveCart = (cart) => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    function addToCart(productId, buttonEl) {
        const product = allProducts.find(p => p.id === productId);
        if (!product) {
            console.error("Producto no encontrado para añadir al carrito:", productId);
            return;
        }

        const cart = getCart();
        const productInCart = cart.find(item => item.id === productId);

        if (productInCart) {
            productInCart.cantidad = (productInCart.cantidad || 1) + 1;
        } else {
            cart.push({ ...product, cantidad: 1 });
        }

        saveCart(cart);

        alert(`'${product.nombre}' fue añadido al carrito.`);
        buttonEl.disabled = true;
        buttonEl.textContent = "¡Añadido!";
        setTimeout(() => {
            buttonEl.disabled = false;
            buttonEl.textContent = "Añadir al Carrito";
        }, 1500);
    }

    // ----------------------------------------------------
    // LÓGICA DE FIRESTORE
    // ----------------------------------------------------

    function buildQuery() {
        let q = collection(db, PRODUCTS_COLLECTION_PATH);
        const filters = [];
        if (currentCategory !== 'all') {
            filters.push(where('categoria', '==', currentCategory));
        }
        if ((currentFilters.marca || []).length > 0) {
            filters.push(where('marca', 'in', currentFilters.marca));
        }
        return filters.length > 0 ? query(q, ...filters) : q;
    }

    function handleSnapshot(snapshot) {
        let products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });
        
        allProducts = products;
        
        renderProducts(products);
        updateDynamicFilters(products);
    }

    // ----------------------------------------------------
    // LÓGICA DE INTERFAZ Y EVENTOS
    // ----------------------------------------------------

    function updateDynamicFilters(products) {
        if (!brandFilterListEl) return;
        const brands = [...new Set(products.map(p => p.marca).filter(Boolean))].sort();
        brandFilterListEl.innerHTML = brands.map(brand => `
            <li><label><input type="checkbox" name="marca" value="${brand}" ${(currentFilters.marca || []).includes(brand) ? 'checked' : ''}> ${brand}</label></li>
        `).join('');
    }

    function setupEventListeners() {
        if (sortEl) {
            sortEl.addEventListener('change', () => {
                currentSort = sortEl.value;
                startListening();
            });
        }

        if (brandFilterListEl) {
            brandFilterListEl.addEventListener('change', (e) => {
                if (e.target.name === 'marca') {
                    const selected = Array.from(brandFilterListEl.querySelectorAll('input:checked')).map(i => i.value);
                    currentFilters.marca = selected;
                    startListening();
                }
            });
        }

        if (productGridEl) {
            productGridEl.addEventListener('click', (e) => {
                if (e.target.classList.contains('add-to-cart-btn')) {
                    e.preventDefault();
                    const productId = e.target.getAttribute('data-id');
                    addToCart(productId, e.target);
                }
            });
        }
    }

    // ----------------------------------------------------
    // INICIO
    // ----------------------------------------------------

    let unsubscribe = null;
    function startListening() {
        if (unsubscribe) unsubscribe();
        if (titleEl) {
            titleEl.textContent = currentCategory === 'all' ? 'Todos los Productos' : `Categoría: ${currentCategory.charAt(0).toUpperCase() + currentCategory.slice(1)}`;
        }
        if (loadingMessageEl) loadingMessageEl.style.display = 'block';
        if (productGridEl) productGridEl.innerHTML = '';
        
        const q = buildQuery();
        unsubscribe = onSnapshot(q, handleSnapshot, (error) => {
            console.error("Error al escuchar productos:", error);
            if (loadingMessageEl) loadingMessageEl.textContent = "Error al cargar productos.";
        });
    }

    setupEventListeners();
    startListening();
}

// --- CORRECCIÓN DEFINITIVA (ANTI-RACE-CONDITION) ---
function main() {
    if (window.db) {
        initProductPage();
    } else {
        document.addEventListener('firebase-ready', initProductPage);
    }
}

main();
