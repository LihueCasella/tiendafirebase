// js/carrito.js
// Lógica principal para la gestión del carrito en tiempo real con Firestore.

// ----------------------------------------------------
// 1. VARIABLES GLOBALES Y DOM
// ----------------------------------------------------

// Almacenará los productos del carrito como un mapa {id: {name, price, quantity, ...}}
let cartItems = {}; 

const DOMElements = {
    loadingMessage: document.getElementById('loading-message'),
    cartContent: document.getElementById('cart-content'),
    emptyCartView: document.getElementById('empty-cart-view'),
    cartSummary: document.getElementById('cart-summary'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    cartTotal: document_1.getElementById('cart-total')
};

// ----------------------------------------------------
// 2. LÓGICA DE FIRESTORE (Lectura y Escritura)
// ----------------------------------------------------

/**
 * Escucha la colección del carrito del usuario en tiempo real.
 */
function listenToCart() {
    // ⚠️ COMPROBACIÓN CRÍTICA
    if (!window.auth.currentUser || !window.db) {
        DOMElements.loadingMessage.textContent = 'Por favor, espera la autenticación para cargar tu carrito.';
        // Reintentar si no está listo, o esperar el onAuthStateChanged (ya manejado en HTML)
        setTimeout(listenToCart, 1000); 
        return;
    }

    const userId = window.auth.currentUser.uid;
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    
    // Referencia al documento que contiene todos los ítems del carrito
    const cartDocRef = window.doc(window.db, `artifacts/${appId}/users/${userId}/carrito/items`);

    DOMElements.loadingMessage.textContent = 'Conectando al carrito...';

    // Usamos onSnapshot para escuchar cambios en tiempo real
    window.onSnapshot(cartDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            // El documento de carrito existe. Sus datos son un mapa de productos.
            cartItems = docSnapshot.data();
        } else {
            // El documento no existe (carrito vacío)
            cartItems = {};
        }

        renderCart();

    }, (error) => {
        console.error("Error al escuchar el carrito:", error);
        DOMElements.loadingMessage.textContent = 'Error al cargar el carrito. Inténtalo de nuevo.';
    });
}

/**
 * Actualiza la cantidad de un producto en el carrito.
 * @param {string} productId - ID del producto.
 * @param {number} newQuantity - Nueva cantidad (debe ser >= 1).
 */
async function updateItemQuantity(productId, newQuantity) {
    if (newQuantity < 1) return removeItem(productId); // Si llega a 0, eliminar

    if (!window.auth.currentUser) {
        alert("Necesitas estar conectado."); 
        return;
    }

    const userId = window.auth.currentUser.uid;
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const cartDocRef = window.doc(window.db, `artifacts/${appId}/users/${userId}/carrito/items`);
    
    try {
        // En Firestore, el campo se actualiza con el valor absoluto, no un incremento/decremento.
        await window.updateDoc(cartDocRef, {
            [`${productId}.quantity`]: newQuantity
        });
        console.log(`Cantidad de ${productId} actualizada a ${newQuantity}.`);
    } catch (error) {
        console.error("Error al actualizar cantidad:", error);
    }
}

/**
 * Elimina un producto del carrito.
 * @param {string} productId - ID del producto a eliminar.
 */
async function removeItem(productId) {
    if (!window.auth.currentUser) {
        alert("Necesitas estar conectado."); 
        return;
    }

    const userId = window.auth.currentUser.uid;
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const cartDocRef = window.doc(window.db, `artifacts/${appId}/users/${userId}/carrito/items`);
    
    try {
        // Usamos deleteField para eliminar la clave del mapa que corresponde al producto.
        await window.updateDoc(cartDocRef, {
            [productId]: window.deleteField()
        });
        console.log(`Producto ${productId} eliminado del carrito.`);
    } catch (error) {
        console.error("Error al eliminar producto:", error);
    }
}

// ----------------------------------------------------
// 3. RENDERIZADO Y EVENTOS DEL DOM
// ----------------------------------------------------

/**
 * Renderiza la tabla del carrito y el resumen.
 */
function renderCart() {
    const productIds = Object.keys(cartItems);
    let subtotal = 0;

    if (productIds.length === 0) {
        // Carrito vacío
        DOMElements.loadingMessage.classList.add('hidden');
        DOMElements.emptyCartView.classList.remove('hidden');
        DOMElements.cartSummary.classList.add('hidden');
        DOMElements.cartContent.innerHTML = '';
        return;
    }

    // Carrito con ítems
    DOMElements.emptyCartView.classList.add('hidden');
    DOMElements.loadingMessage.classList.add('hidden');
    DOMElements.cartSummary.classList.remove('hidden');

    let tableHTML = `
        <table class="cart-table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>Precio Unitario</th>
                    <th>Cantidad</th>
                    <th>Total por Ítem</th>
                    <th></th>
                </tr>
            </thead>
            <tbody id="cart-table-body">
    `;

    productIds.forEach(id => {
        const item = cartItems[id];
        const itemTotal = (item.price || 0) * (item.quantity || 1);
        subtotal += itemTotal;

        const formattedPrice = (item.price || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        const formattedItemTotal = itemTotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

        tableHTML += `
            <tr data-id="${id}">
                <td data-label="Producto" class="product-details">
                    <!-- Usamos un placeholder, idealmente deberías tener la URL de la imagen aquí -->
                    <img src="https://placehold.co/80x80/2a9d8f/ffffff?text=${item.name.substring(0, 1)}" 
                         alt="${item.name}" class="cart-item-image">
                    <span class="item-name">${item.name}</span>
                </td>
                <td data-label="Precio Unitario">${formattedPrice}</td>
                <td data-label="Cantidad">
                    <div class="quantity-controls">
                        <button class="qty-minus" data-id="${id}">-</button>
                        <input type="number" class="qty-input" data-id="${id}" value="${item.quantity}" min="1" readonly>
                        <button class="qty-plus" data-id="${id}">+</button>
                    </div>
                </td>
                <td data-label="Total por Ítem">${formattedItemTotal}</td>
                <td>
                    <button class="remove-btn" data-id="${id}" aria-label="Eliminar producto">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tableHTML += '</tbody></table>';
    DOMElements.cartContent.innerHTML = tableHTML;

    // Actualizar Resumen
    const formattedSubtotal = subtotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    DOMElements.cartSubtotal.textContent = formattedSubtotal;
    // Por ahora, el total es igual al subtotal (sin impuestos/envío)
    DOMElements.cartTotal.textContent = formattedSubtotal;
    
    // Re-configurar listeners después de renderizar la tabla
    setupCartEventListeners();
}

/**
 * Inicializa los listeners para los botones de cantidad y eliminación.
 */
function setupCartEventListeners() {
    const tableBody = document.getElementById('cart-table-body');
    if (!tableBody) return;

    tableBody.addEventListener('click', (e) => {
        const target = e.target;
        const button = target.closest('button');

        if (button) {
            const productId = button.dataset.id;
            const item = cartItems[productId];
            if (!item) return;

            // 1. Botón de Aumentar Cantidad
            if (button.classList.contains('qty-plus')) {
                updateItemQuantity(productId, item.quantity + 1);
            } 
            // 2. Botón de Disminuir Cantidad
            else if (button.classList.contains('qty-minus')) {
                const newQty = item.quantity - 1;
                if (newQty < 1) {
                    // Si se intenta bajar de 1, preguntar si quiere eliminar
                    if (confirm(`¿Estás seguro de que quieres eliminar "${item.name}" del carrito?`)) {
                        removeItem(productId);
                    }
                } else {
                    updateItemQuantity(productId, newQty);
                }
            } 
            // 3. Botón de Eliminar
            else if (button.classList.contains('remove-btn')) {
                if (confirm(`¿Estás seguro de que quieres eliminar "${item.name}" del carrito?`)) {
                    removeItem(productId);
                }
            }
        }
    });

    // Añadir listener para Finalizar Compra
    const checkoutBtn = DOMElements.cartSummary.querySelector('.checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            alert("Procesando pago... (¡Falta implementar la lógica de Checkout!)");
        });
    }
}

// ----------------------------------------------------
// 4. INICIALIZACIÓN
// ----------------------------------------------------

/**
 * Función que se ejecuta al cargar la página.
 */
function initCartPage() {
    // 1. Iniciar la escucha del carrito en Firebase
    // Nota: La autenticación se maneja en el HTML, pero hacemos un chequeo de seguridad.
    // Daremos tiempo para que el onAuthStateChanged en el HTML termine.
    setTimeout(listenToCart, 500); 
}


// Ejecutar la función principal al cargar el script
initCartPage();
