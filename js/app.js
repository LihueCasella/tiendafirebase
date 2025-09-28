// js/app.js - Lógica de Productos Destacados (Homepage)
// Versión corregida para usar el mismo método de lectura que productos.js

function initializeApp() {
    const productGrid = document.querySelector('.product-grid');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const cartIcon = document.querySelector('.cart-icon');

    if (!productGrid) {
        // Si no estamos en la página de inicio, solo actualizamos el carrito si la función existe y salimos.
        if (typeof updateCartCount === 'function') updateCartCount();
        return;
    }

    // Se obtienen las funciones de Firebase desde la ventana global (inicializadas por firebase-init.js)
    const { db, collection, query, where, limit, onSnapshot, doc, getDoc } = window;
    const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const PRODUCTS_COLLECTION_PATH = `/artifacts/${APP_ID}/public/data/productos`;

    let unsubscribe = null; // Variable para guardar la función de cancelación del listener

    /**
     * Prepara y activa un listener de Firestore (onSnapshot) para una categoría específica.
     * Copia la estrategia de js/productos.js para asegurar consistencia.
     * @param {string} category - La categoría de productos a escuchar.
     */
    function listenForFeaturedProducts(category) {
        if (!category) return;

        // Si ya hay un listener activo, lo desactivamos para evitar duplicados
        if (unsubscribe) {
            unsubscribe();
        }

        productGrid.innerHTML = '<p style="text-align: center; padding: 20px;">Cargando...</p>';

        try {
            // Se crea la consulta a Firestore, filtrando por categoría y limitando a 3 productos.
            const q = query(collection(db, PRODUCTS_COLLECTION_PATH), where("categoria", "==", category), limit(3));

            // Se activa el listener onSnapshot. Se ejecutará cada vez que los datos cambien.
            unsubscribe = onSnapshot(q, (querySnapshot) => {
                const products = [];
                querySnapshot.forEach((doc) => {
                    products.push({ id: doc.id, ...doc.data() });
                });
                renderProducts(products);
            }, (error) => {
                console.error("Error escuchando productos destacados:", error);
                productGrid.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">Error al cargar productos.</p>`;
            });
        } catch (error) {
            console.error("Error al crear la consulta de productos:", error);
        }
    }

    /**
     * Renderiza las tarjetas de producto en el DOM.
     */
    function renderProducts(productsToRender) {
        productGrid.innerHTML = '';
        if (productsToRender.length === 0) {
            productGrid.innerHTML = '<p style="text-align: center; padding: 20px;">No hay productos destacados en esta categoría.</p>';
            return;
        }
        productsToRender.forEach(product => {
            productGrid.innerHTML += `
                <a href="detalle.html?id=${product.id}" class="product-card-link">
                    <article class="product-card">
                        <img src="${product.image}" alt="${product.nombre}" onerror="this.src=\'https://placehold.co/300x300/eee/aaa?text=Error\';">
                        <div class="product-info">
                            <p class="product-name">${product.nombre}</p>
                            <p class="product-price">$${(product.precio || 0).toLocaleString('es-AR')}</p>
                            <button class="btn btn-small add-to-cart" data-id="${product.id}">Añadir</button>
                        </div>
                    </article>
                </a>
            `;
        });
        // Se vuelven a asignar los listeners para los nuevos botones "Añadir"
        document.querySelectorAll('.add-to-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                addToCart(e.target.dataset.id);
            });
        });
    }

    // --- Lógica del Carrito (sin cambios) ---
    const getProductById = async (productId) => {
        const docRef = doc(db, PRODUCTS_COLLECTION_PATH, productId);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    };
    const getCart = () => JSON.parse(localStorage.getItem('cart')) || [];
    const saveCart = (cart) => { localStorage.setItem('cart', JSON.stringify(cart)); updateCartCount(); };
    const addToCart = async (productId) => {
        const cart = getCart();
        const productExists = cart.find(item => item.id === productId);
        if (productExists) productExists.quantity++;
        else {
            const productData = await getProductById(productId);
            if (productData) cart.push({ id: productId, quantity: 1, name: productData.nombre, price: productData.precio });
        }
        saveCart(cart);
        alert('Producto añadido/actualizado.');
    };
    const updateCartCount = () => {
        if (!cartIcon) return;
        const totalItems = getCart().reduce((sum, item) => sum + item.quantity, 0);
        cartIcon.textContent = `🛒 Carrito (${totalItems})`;
    };

    // --- Configuración de Eventos ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const newCategory = button.textContent.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            listenForFeaturedProducts(newCategory);
        });
    });

    // --- Arranque inicial ---
    listenForFeaturedProducts('tecnologia'); // Carga inicial de productos de tecnología
    updateCartCount();
}

// --- Punto de Entrada Principal ---
// Se asegura de que el código se ejecute solo cuando Firebase esté listo.
document.addEventListener('firebase-ready', initializeApp);
