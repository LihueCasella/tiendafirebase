// js/detalle.js (Version 4 - Robusta)
// Lógica principal para la página de detalle del producto.

// ----------------------------------------------------
// 1. VARIABLES GLOBALES Y DOM
// ----------------------------------------------------

let currentProductId = null;
let currentProductData = null; 

const DOMElements = {
    loadingMessage: document.getElementById('loading-message'),
    productContent: document.getElementById('product-content'),
    pageTitle: document.getElementById('page-title'),
    mainImage: document.getElementById('detail-main-image'),
    name: document.getElementById('detail-name'),
    brand: document.getElementById('detail-brand'),
    price: document.getElementById('detail-price'),
    description: document.getElementById('detail-description'),
    specs: document.getElementById('detail-specs'),
    qtyMinus: document.getElementById('qty-minus'),
    qtyPlus: document.getElementById('qty-plus'),
    qtyInput: document.getElementById('qty-input'),
    addToCartBtn: document.getElementById('add-to-cart-btn')
};

// ----------------------------------------------------
// 2. UTILIDADES
// ----------------------------------------------------

function getProductIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function showContent() {
    if (DOMElements.loadingMessage) DOMElements.loadingMessage.classList.add('hidden');
    if (DOMElements.productContent) DOMElements.productContent.classList.remove('hidden');
}

function displayError(message) {
    if (DOMElements.loadingMessage) {
        DOMElements.loadingMessage.textContent = `Error: ${message}`;
        DOMElements.loadingMessage.style.color = 'red';
        DOMElements.loadingMessage.classList.remove('hidden');
    }
    if (DOMElements.productContent) DOMElements.productContent.classList.add('hidden');
}

// ----------------------------------------------------
// 3. CONSULTA A FIRESTORE Y RENDERIZADO
// ----------------------------------------------------

async function loadProductDetails() {
    currentProductId = getProductIdFromURL();
    if (!currentProductId) {
        displayError("ID de producto no especificado en la URL.");
        return;
    }

    // Mecanismo de sondeo para esperar a que Firebase esté listo
    if (!window.db || !window.doc || !window.getDoc) {
        setTimeout(loadProductDetails, 100);
        return;
    }
    
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    
    try {
        const productDocRef = window.doc(window.db, `artifacts/${appId}/public/data/productos`, currentProductId);
        const productSnap = await window.getDoc(productDocRef);

        if (productSnap.exists()) {
            currentProductData = { id: productSnap.id, ...productSnap.data() };
            renderProduct(currentProductData);
        } else {
            displayError(`El producto con ID "${currentProductId}" no existe.`);
        }
    } catch (error) {
        console.error("Error al cargar detalles del producto:", error);
        displayError("Error de base de datos al cargar el producto.");
    }
}

function renderProduct(product) {
    const priceNumber = Number(product.precio) || 0;
    const formattedPrice = priceNumber.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

    DOMElements.pageTitle.textContent = `${product.nombre} | MegaStore`;
    DOMElements.mainImage.src = product.image || 'https://placehold.co/500x400/eeeeee/333333?text=Sin+Imagen';
    DOMElements.mainImage.alt = product.nombre;
    DOMElements.name.textContent = product.nombre;
    DOMElements.brand.textContent = product.marca ? `Marca: ${product.marca}` : 'Marca no especificada';
    DOMElements.price.textContent = formattedPrice;
    DOMElements.description.textContent = product.descripcion || 'Este producto no tiene una descripción detallada.';

    let specsHtml = '<h4>Especificaciones Clave</h4><ul>';
    const specs = { ...product };
    delete specs.id; delete specs.nombre; delete specs.marca; delete specs.precio; delete specs.descripcion; delete specs.image; delete specs.categoria;

    if (Object.keys(specs).length > 0) {
        for (const key in specs) {
            specsHtml += `<li><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${specs[key]}</li>`;
        }
    } else {
        specsHtml += '<li>No hay especificaciones adicionales disponibles.</li>';
    }
    specsHtml += '</ul>';
    if(DOMElements.specs) DOMElements.specs.innerHTML = specsHtml;

    // Habilitamos los controles solo cuando todo está listo.
    if(DOMElements.addToCartBtn) DOMElements.addToCartBtn.disabled = false;
    if(DOMElements.qtyMinus) DOMElements.qtyMinus.disabled = false;
    if(DOMElements.qtyPlus) DOMElements.qtyPlus.disabled = false;
    if(DOMElements.qtyInput) DOMElements.qtyInput.disabled = false;

    showContent();
}

// ----------------------------------------------------
// 4. LÓGICA DEL CARRITO (LOCALSTORAGE)
// ----------------------------------------------------

const getCart = () => {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

const saveCart = (cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateQuantity(delta) {
    let currentQty = parseInt(DOMElements.qtyInput.value) || 1;
    let newQty = currentQty + delta;
    if (newQty < 1) newQty = 1;
    DOMElements.qtyInput.value = newQty;
}

function addProductToCart() {
    if (!currentProductData) {
        alert("Error de Sincronización. Por favor, espere a que la página cargue completamente y vuelva a intentarlo.");
        return;
    }

    const quantityToAdd = parseInt(DOMElements.qtyInput.value) || 1;
    const cart = getCart();
    const productInCart = cart.find(item => item.id === currentProductData.id);

    if (productInCart) {
        productInCart.cantidad = (productInCart.cantidad || 0) + quantityToAdd;
    } else {
        const cartProduct = {
            id: currentProductData.id,
            nombre: currentProductData.nombre,
            precio: currentProductData.precio,
            image: currentProductData.image,
            cantidad: quantityToAdd
        };
        cart.push(cartProduct);
    }

    saveCart(cart);
    alert(`¡${quantityToAdd} unidad(es) de "${currentProductData.nombre}" se han añadido al carrito!`);
}

// ----------------------------------------------------
// 5. INICIALIZACIÓN
// ----------------------------------------------------

function setupEventListeners() {
    if(DOMElements.qtyMinus) DOMElements.qtyMinus.addEventListener('click', () => updateQuantity(-1));
    if(DOMElements.qtyPlus) DOMElements.qtyPlus.addEventListener('click', () => updateQuantity(1));
    if(DOMElements.addToCartBtn) DOMElements.addToCartBtn.addEventListener('click', addProductToCart);
}

function initDetailPage() {
    // Deshabilitamos los controles al iniciar para evitar clicks prematuros.
    if(DOMElements.addToCartBtn) DOMElements.addToCartBtn.disabled = true;
    if(DOMElements.qtyMinus) DOMElements.qtyMinus.disabled = true;
    if(DOMElements.qtyPlus) DOMElements.qtyPlus.disabled = true;
    if(DOMElements.qtyInput) DOMElements.qtyInput.disabled = true;

    loadProductDetails();
    setupEventListeners();
}

document.addEventListener('DOMContentLoaded', initDetailPage);
