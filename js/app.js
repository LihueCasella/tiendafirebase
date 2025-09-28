// js/app.js (Versión con más logging para depuración)

import { db, collection, query, where, limit, getDocs, doc, getDoc } from './firebase-init.js';

export function startFeaturedProducts() {
    const tecGrid = document.getElementById('tecnologia-grid');
    const indumentariaGrid = document.getElementById('indumentaria-grid');
    const hogarGrid = document.getElementById('hogar-grid');
    const cartIcon = document.querySelector('.cart-icon');

    if (!tecGrid || !indumentariaGrid || !hogarGrid) {
        if (typeof updateCartCount === 'function') updateCartCount();
        return;
    }

    const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const PRODUCTS_COLLECTION_PATH = `/artifacts/${APP_ID}/public/data/productos`;

    async function loadCategory(category, gridElement, count) {
        if (!category || !gridElement) return;
        gridElement.innerHTML = '<p style="text-align: center; padding: 20px;">Cargando...</p>';

        try {
            const q = query(collection(db, PRODUCTS_COLLECTION_PATH), where("categoria", "==", category), limit(count));
            const querySnapshot = await getDocs(q);
            
            // Log para ver cuántos productos se encontraron
            console.log(`Categoría '${category}': ${querySnapshot.size} productos encontrados.`);

            const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            renderProducts(products, gridElement);

        } catch (error) {
            console.error(`Error cargando la categoría ${category}:`, error);
            gridElement.innerHTML = `<p style="color: red; text-align: center; padding: 20px;">Error al cargar productos.</p>`;
        }
    }

    function renderProducts(productsToRender, gridElement) {
        gridElement.innerHTML = '';
        if (productsToRender.length === 0) {
            gridElement.innerHTML = '<p style="text-align: center; padding: 20px;">No hay productos destacados para mostrar.</p>';
            return;
        }

        productsToRender.forEach(product => {
            gridElement.innerHTML += `
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

        gridElement.querySelectorAll('.add-to-cart').forEach(button => {
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
        if (productExists) {
            productExists.quantity++;
        } else {
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

    // --- Arranque inicial (ahora pidiendo 2 productos) --- 
    console.log("Iniciando la carga de productos destacados...");
    loadCategory('tecnologia', tecGrid, 2);
    loadCategory('indumentaria', indumentariaGrid, 2);
    loadCategory('hogar', hogarGrid, 2);
    updateCartCount();
}
