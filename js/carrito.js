// js/carrito.js
// Lógica para la página del carrito de compras usando LocalStorage.

// ----------------------------------------------------
// 1. VARIABLES GLOBALES Y DOM
// ----------------------------------------------------

const DOMElements = {
    loadingMessage: document.getElementById('loading-message'),
    cartContent: document.getElementById('cart-content'),
    emptyCartView: document.getElementById('empty-cart-view'),
    cartSummary: document.getElementById('cart-summary'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    cartTotal: document.getElementById('cart-total') 
};

// ----------------------------------------------------
// 2. LÓGICA DEL CARRITO (LOCALSTORAGE)
// ----------------------------------------------------

const getCart = () => {
    try {
        const cart = localStorage.getItem('cart');
        return cart ? JSON.parse(cart) : [];
    } catch (e) {
        console.error("Error al leer el carrito de LocalStorage:", e);
        return [];
    }
};

const saveCart = (cart) => {
    try {
        localStorage.setItem('cart', JSON.stringify(cart));
    } catch (e) {
        console.error("Error al guardar el carrito en LocalStorage:", e);
    }
};

function removeItem(productId) {
    let cart = getCart();
    const productToRemove = cart.find(item => item.id === productId);
    
    if (productToRemove && confirm(`¿Estás seguro de que quieres eliminar "${productToRemove.nombre}" del carrito?`)) {
        cart = cart.filter(item => item.id !== productId);
        saveCart(cart);
        renderCart(); // Volver a renderizar para mostrar los cambios
    }
}

// ----------------------------------------------------
// 3. RENDERIZADO Y EVENTOS DEL DOM
// ----------------------------------------------------

function renderCart() {
    const cart = getCart();
    let subtotal = 0;

    // Ocultar mensaje de carga y mostrar la vista correcta
    if (DOMElements.loadingMessage) DOMElements.loadingMessage.classList.add('hidden');

    if (cart.length === 0) {
        // Carrito vacío
        if (DOMElements.emptyCartView) DOMElements.emptyCartView.classList.remove('hidden');
        if (DOMElements.cartSummary) DOMElements.cartSummary.classList.add('hidden');
        if (DOMElements.cartContent) DOMElements.cartContent.innerHTML = '';
        return;
    }

    // Carrito con ítems
    if (DOMElements.emptyCartView) DOMElements.emptyCartView.classList.add('hidden');
    if (DOMElements.cartSummary) DOMElements.cartSummary.classList.remove('hidden');

    let cartHTML = '<ul class="cart-items-list">';

    cart.forEach(item => {
        const itemTotal = (item.precio || 0) * (item.cantidad || 1);
        subtotal += itemTotal;

        const formattedPrice = (item.precio || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        const imageSrc = item.image || `https://placehold.co/80x80/eee/333?text=${item.nombre.substring(0,1)}`;

        cartHTML += `
            <li class="cart-item" data-id="${item.id}">
                <a href="detalle.html?id=${item.id}" class="item-image-link">
                    <img src="${imageSrc}" alt="${item.nombre}" class="cart-item-image">
                </a>
                <div class="item-info">
                    <a href="detalle.html?id=${item.id}" class="item-name-link">
                        <span class="item-name">${item.nombre}</span>
                    </a>
                    <span class="item-price">${formattedPrice} x ${item.cantidad}</span>
                </div>
                <div class="item-actions">
                    <button class="remove-btn" data-id="${item.id}" aria-label="Quitar producto">Quitar</button>
                </div>
            </li>
        `;
    });

    cartHTML += '</ul>';
    if (DOMElements.cartContent) DOMElements.cartContent.innerHTML = cartHTML;

    // Actualizar Resumen
    const formattedSubtotal = subtotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    if (DOMElements.cartSubtotal) DOMElements.cartSubtotal.textContent = formattedSubtotal;
    if (DOMElements.cartTotal) DOMElements.cartTotal.textContent = formattedSubtotal; // Total = Subtotal por ahora
}

function setupEventListeners() {
    if (!DOMElements.cartContent) return;

    DOMElements.cartContent.addEventListener('click', (e) => {
        // Delegación de eventos para el botón de quitar
        if (e.target.classList.contains('remove-btn')) {
            const productId = e.target.getAttribute('data-id');
            if (productId) {
                removeItem(productId);
            }
        }
    });
}

// ----------------------------------------------------
// 4. INICIALIZACIÓN
// ----------------------------------------------------

function initCartPage() {
    renderCart();
    setupEventListeners();
}

// Asegurarnos que el DOM esté listo antes de ejecutar
document.addEventListener('DOMContentLoaded', initCartPage);
