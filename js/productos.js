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
    // RENDERIZADO Y CARRITO
    // ----------------------------------------------------

    function renderProductCard(product) {
        const imageUrl = product.imagenUrl || `https://placehold.co/300x300/eee/333?text=${product.nombre.substring(0,10)}`;
        // Envolvemos toda la tarjeta en un enlace
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
            loadingMessageEl.style.display = 'none';
            return;
        }
        productGridEl.innerHTML = products.map(renderProductCard).join('');
        loadingMessageEl.style.display = 'none';
    }

    async function addToCart(productId, buttonEl) {
        if (!window.auth || !window.auth.currentUser) {
            alert("Por favor, inicia sesión para añadir productos a tu carrito.");
            return;
        }

        const product = allProducts.find(p => p.id === productId);
        if (!product) return;

        const userId = window.auth.currentUser.uid;
        const cartItemRef = doc(db, `artifacts/${APP_ID}/users/${userId}/carrito/items`, productId);

        buttonEl.disabled = true;
        buttonEl.textContent = "Añadiendo...";

        try {
            await runTransaction(db, async (transaction) => {
                const cartDoc = await transaction.get(cartItemRef);
                if (!cartDoc.exists()) {
                    transaction.set(cartItemRef, { ...product, cantidad: 1 });
                } else {
                    const newQuantity = cartDoc.data().cantidad + 1;
                    transaction.update(cartItemRef, { cantidad: newQuantity });
                }
            });

            buttonEl.textContent = "¡Añadido!";
            setTimeout(() => {
                buttonEl.disabled = false;
                buttonEl.textContent = "Añadir al Carrito";
            }, 1500);

        } catch (error) {
            console.error("Error al añadir al carrito: ", error);
            alert("No se pudo añadir el producto. Inténtalo de nuevo.");
            buttonEl.disabled = false;
            buttonEl.textContent = "Añadir al Carrito";
        }
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
                // Si el clic fue en un botón de carrito
                if (e.target.classList.contains('add-to-cart-btn')) {
                    // Prevenimos que el enlace de la tarjeta se active
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

document.addEventListener('firebase-ready', initProductPage);