// js/app.js (CORREGIDO Y FINAL)

document.addEventListener('firebase-ready', () => {
    initializeApp();
});

function initializeApp() {

    const productGrid = document.querySelector('.product-grid');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const cartIcon = document.querySelector('.cart-icon');

    if (!productGrid) {
        updateCartCount();
        return;
    }

    const { db, collection, query, where, getDocs, limit, doc, getDoc } = window;
    const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const PRODUCTS_COLLECTION_PATH = `/artifacts/${APP_ID}/public/data/productos`;
    const productsCollectionRef = collection(db, PRODUCTS_COLLECTION_PATH);

    async function fetchProducts(category, count = 4) { // Aumentamos a 4 para que se vea mejor
        if (!category) return;
        
        productGrid.innerHTML = '<p style="text-align: center; padding: 20px;">Cargando...</p>';

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
            productGrid.innerHTML = `<p style="text-align: center; color: red; padding: 20px;">Error al cargar productos.</p>`;
        }
    }

    async function getProductById(productId) {
        try {
            const docRef = doc(db, PRODUCTS_COLLECTION_PATH, productId);
            const docSnap = await getDoc(docRef);
            return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
        } catch (error) {
            console.error("Error fetching product by ID:", error);
            return null;
        }
    }

    function renderProducts(productsToRender) {
        productGrid.innerHTML = '';

        if (productsToRender.length === 0) {
            productGrid.innerHTML = '<p style="text-align: center; padding: 20px;">No hay productos destacados para esta categoría.</p>';
            return;
        }

        productsToRender.forEach(product => {
            const cardHTML = `
                <a href="detalle.html?id=${product.id}" class="product-card-link">
                    <article class="product-card" data-id="${product.id}">
                        <img src="${product.image}" alt="${product.nombre}" onerror="this.src='https://placehold.co/300x300/eee/aaa?text=Error';">
                        <div class="product-info">
                            <p class="product-name">${product.nombre}</p>
                            <p class="product-price">$${(product.precio || 0).toLocaleString('es-AR')}</p>
                            <button class="btn btn-small add-to-cart" data-id="${product.id}">Añadir</button>
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
                addToCart(e.target.dataset.id);
            });
        });
    }

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // SOLUCIÓN: Normalizar el texto para quitar tildes.
            const newCategory = button.textContent.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            fetchProducts(newCategory);
        });
    });

    const getCart = () => JSON.parse(localStorage.getItem('cart')) || [];
    const saveCart = (cart) => {
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
    }

    async function addToCart(productId) {
        const cart = getCart();
        const productExists = cart.find(item => item.id === productId);

        if (productExists) {
            productExists.quantity++;
        } else {
            const productData = await getProductById(productId);
            if (productData) {
                cart.push({ id: productId, quantity: 1, name: productData.nombre, price: productData.precio });
            }
        }
        saveCart(cart);
        alert('Producto añadido/actualizado en el carrito.');
    }

    function updateCartCount() {
        if (!cartIcon) return;
        const totalItems = getCart().reduce((sum, item) => sum + item.quantity, 0);
        cartIcon.textContent = `🛒 Carrito (${totalItems})`;
    }

    // Carga inicial
    fetchProducts('tecnologia');
    updateCartCount();
}
