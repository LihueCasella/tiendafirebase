// js/app.js

document.addEventListener('DOMContentLoaded', () => {

    // Esperar a que los objetos de Firebase estén disponibles en la ventana global
    // Esto es configurado en `index.html`
    const checkFirebase = setInterval(() => {
        if (window.db && window.collection) {
            clearInterval(checkFirebase);
            initializeApp();
        }
    }, 100);

    // 1. SELECCIÓN DE ELEMENTOS DEL DOM
    const productGrid = document.querySelector('.product-grid');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const cartIcon = document.querySelector('.cart-icon');

    // Función principal de inicialización
    function initializeApp() {
        // Si no estamos en la página de inicio, solo actualizamos el carrito y salimos.
        if (!productGrid) {
            updateCartCount();
            return;
        }

        // 2. CONFIGURACIÓN DE FIRESTORE
        const { db, collection, query, where, getDocs, limit, doc, getDoc } = window;
        const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        const PRODUCTS_COLLECTION_PATH = `/artifacts/${APP_ID}/public/data/productos`;
        const productsCollectionRef = collection(db, PRODUCTS_COLLECTION_PATH);

        // 3. FUNCIONES DE DATOS (FIRESTORE)
        async function fetchProducts(category, count = 2) {
            if (!category) return;
            
            productGrid.innerHTML = '<p>Cargando productos...</p>';

            try {
                const q = query(productsCollectionRef, where("categoria", "==", category), limit(count));
                const querySnapshot = await getDocs(q);

                const products = [];
                querySnapshot.forEach((doc) => {
                    products.push({ id: doc.id, ...doc.data() });
                });

                renderProducts(products);

            } catch (error) {
                console.error("Error fetching products:", error);
                productGrid.innerHTML = `<p>Error al cargar productos. Intente de nuevo.</p>`;
            }
        }

        async function getProductById(productId) {
            try {
                const docRef = doc(db, PRODUCTS_COLLECTION_PATH, productId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    return { id: docSnap.id, ...docSnap.data() };
                } else {
                    console.log("No such product!");
                    return null;
                }
            } catch (error) {
                console.error("Error fetching product by ID:", error);
                return null;
            }
        }

        // 4. FUNCIONES DE RENDERING
        function renderProducts(productsToRender) {
            productGrid.innerHTML = ''; // Limpia la grilla

            if (productsToRender.length === 0) {
                productGrid.innerHTML = '<p>No hay productos disponibles en esta categoría.</p>';
                return;
            }

            productsToRender.forEach(product => {
                const cardHTML = `
                    <a href="detalle.html?id=${product.id}" class="product-card-link">
                        <article class="product-card" data-id="${product.id}" data-category="${product.categoria}">
                            <img src="${product.image}" alt="${product.nombre}" onerror="this.src='https://placehold.co/300x300/ccc/ffffff?text=Imagen no disponible';">
                            <div class="product-info">
                                <p class="product-name">${product.nombre}</p>
                                <p class="product-price">$${(product.precio || 0).toLocaleString('es-AR')}</p>
                                <button class="btn btn-small add-to-cart" data-id="${product.id}">Añadir al Carrito</button>
                            </div>
                        </article>
                    </a>
                `;
                productGrid.innerHTML += cardHTML;
            });

            document.querySelectorAll('.add-to-cart').forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const productId = e.target.dataset.id;
                    addToCart(productId);
                });
            });
        }

        // 5. MANEJO DE PESTAÑAS
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const newCategory = button.textContent.trim().toLowerCase();
                
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                fetchProducts(newCategory, 2);
            });
        });

        // 6. LÓGICA DEL CARRITO (localStorage)
        const getCart = () => {
            const cart = localStorage.getItem('cart');
            return cart ? JSON.parse(cart) : [];
        }

        const saveCart = (cart) => {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
        }

        async function addToCart(productId) {
            const cart = getCart();
            const productExists = cart.find(item => item.id === productId);

            if (productExists) {
                productExists.quantity += 1;
                saveCart(cart);
                alert(`Se añadió otra unidad de ${productExists.name}`);
            } else {
                const productData = await getProductById(productId);
                if (productData) {
                    cart.push({ id: productId, quantity: 1, name: productData.nombre, price: productData.precio });
                    saveCart(cart);
                    alert(`Producto añadido: ${productData.nombre}`);
                } else {
                    alert('No se pudo añadir el producto. No se encontró.');
                }
            }
        }

        function updateCartCount() {
            if (!cartIcon) return;
            const cart = getCart();
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartIcon.textContent = `🛒 Carrito (${totalItems})`;
        }

        // 7. INICIALIZACIÓN DE LA LÓGICA DE LA PÁGINA
        fetchProducts('tecnologia', 2);
        updateCartCount();
    }
});
