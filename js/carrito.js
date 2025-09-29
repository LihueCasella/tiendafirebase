// js/carrito.js
// Lógica para la página del carrito de compras usando LocalStorage.

// --- MAPA DE IMÁGENES DE PRODUCTOS (AÑADIDO PARA EL CARRITO) ---
const productImageMap = {
    "Smartphone Nova 10": "https://images.pexels.com/photos/1092644/pexels-photo-1092644.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "Auriculares Bluetooth P3": "https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "Monitor Curvo 27' Pro": "https://images.pexels.com/photos/1779487/pexels-photo-1779487.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "Jeans Slim Fit Clásicos": "https://images.pexels.com/photos/4210866/pexels-photo-4210866.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "Chaqueta de Invierno Alpina": "https://http2.mlstatic.com/D_NQ_NP_643636-MLA50547416228_072022-O.webp",
    "Camiseta Deportiva DRI-FIT": "https://images.pexels.com/photos/991509/pexels-photo-991509.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "Cafetera Expresso Automática": "https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "Juego de Sábanas de Lino": "https://images.pexels.com/photos/279746/pexels-photo-279746.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1",
    "Aspiradora Robótica Smart": "https://www.lanacion.com.ar/resizer/v2/las-aspiradoras-robots-son-furor-hoy-en-OHHXPJQJB5ANRC7JXTZUF7SNPQ.jpg?auth=8cc3cfe13367ebccd3f577ac486c28c5ecb26c49dab5db81c961064ba30db876&width=880&height=586&quality=70&smart=true",
    "Lámpara de Escritorio LED": "https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
};


// ----------------------------------------------------
// 1. VARIABLES GLOBALES Y DOM
// ----------------------------------------------------

const DOMElements = {
    loadingMessage: document.getElementById('loading-message'),
    cartContent: document.getElementById('cart-content'),
    emptyCartView: document.getElementById('empty-cart-view'),
    cartSummary: document.getElementById('cart-summary'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    cartTotal: document.getElementById('cart-total'),
    // --- Elementos del Modal ---
    modal: document.getElementById('custom-confirm-modal'),
    modalTitle: document.getElementById('confirm-modal-title'),
    modalText: document.getElementById('confirm-modal-text'),
    modalAcceptBtn: document.getElementById('confirm-modal-accept'),
    modalCancelBtn: document.getElementById('confirm-modal-cancel')
};

// ----------------------------------------------------
// 2. LÓGICA DEL MODAL DE CONFIRMACIÓN
// ----------------------------------------------------

function showCustomConfirm(title, text) {
    return new Promise((resolve) => {
        DOMElements.modalTitle.textContent = title;
        DOMElements.modalText.textContent = text;
        DOMElements.modal.classList.remove('hidden');

        // Limpiar listeners antiguos para evitar ejecuciones múltiples
        const newAcceptBtn = DOMElements.modalAcceptBtn.cloneNode(true);
        DOMElements.modalAcceptBtn.parentNode.replaceChild(newAcceptBtn, DOMElements.modalAcceptBtn);
        DOMElements.modalAcceptBtn = newAcceptBtn;

        const newCancelBtn = DOMElements.modalCancelBtn.cloneNode(true);
        DOMElements.modalCancelBtn.parentNode.replaceChild(newCancelBtn, DOMElements.modalCancelBtn);
        DOMElements.modalCancelBtn = newCancelBtn;

        // Añadir nuevos listeners
        DOMElements.modalAcceptBtn.onclick = () => {
            DOMElements.modal.classList.add('hidden');
            resolve(true);
        };
        DOMElements.modalCancelBtn.onclick = () => {
            DOMElements.modal.classList.add('hidden');
            resolve(false);
        };
    });
}

// ----------------------------------------------------
// 3. LÓGICA DEL CARRITO (LOCALSTORAGE)
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

async function removeItem(productId) {
    let cart = getCart();
    const productToRemove = cart.find(item => item.id === productId);
    
    if (productToRemove) {
        const confirmed = await showCustomConfirm(
            'Eliminar Producto',
            `¿Estás seguro de que quieres eliminar "${productToRemove.nombre}" del carrito?`
        );

        if (confirmed) {
            cart = cart.filter(item => item.id !== productId);
            saveCart(cart);
            renderCart(); // Volver a renderizar para mostrar los cambios
        }
    }
}

// ----------------------------------------------------
// 4. RENDERIZADO Y EVENTOS DEL DOM
// ----------------------------------------------------

function renderCart() {
    const cart = getCart();
    let subtotal = 0;

    if (DOMElements.loadingMessage) DOMElements.loadingMessage.classList.add('hidden');

    if (cart.length === 0) {
        if (DOMElements.emptyCartView) DOMElements.emptyCartView.classList.remove('hidden');
        if (DOMElements.cartSummary) DOMElements.cartSummary.classList.add('hidden');
        if (DOMElements.cartContent) DOMElements.cartContent.innerHTML = '';
        return;
    }

    if (DOMElements.emptyCartView) DOMElements.emptyCartView.classList.add('hidden');
    if (DOMElements.cartSummary) DOMElements.cartSummary.classList.remove('hidden');

    let cartHTML = '<ul class="cart-items-list">';

    cart.forEach(item => {
        const itemTotal = (item.precio || 0) * (item.cantidad || 1);
        subtotal += itemTotal;

        const formattedPrice = (item.precio || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        const imageSrc = productImageMap[item.nombre] || item.image || `https://placehold.co/80x80/eee/333?text=${item.nombre.substring(0,1)}`;

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

    const formattedSubtotal = subtotal.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    if (DOMElements.cartSubtotal) DOMElements.cartSubtotal.textContent = formattedSubtotal;
    if (DOMElements.cartTotal) DOMElements.cartTotal.textContent = formattedSubtotal; 
}

function setupEventListeners() {
    if (!DOMElements.cartContent) return;

    DOMElements.cartContent.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-btn')) {
            const productId = e.target.getAttribute('data-id');
            if (productId) {
                removeItem(productId);
            }
        }
    });
}

// ----------------------------------------------------
// 5. INICIALIZACIÓN
// ----------------------------------------------------

function initCartPage() {
    renderCart();
    setupEventListeners();
}

document.addEventListener('DOMContentLoaded', initCartPage);
