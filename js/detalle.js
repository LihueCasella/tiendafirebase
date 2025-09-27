// js/detalle.js
// Lógica principal para la página de detalle del producto.

// ----------------------------------------------------
// 1. VARIABLES GLOBALES Y DOM
// ----------------------------------------------------

let currentProductId = null;
let currentProductData = null; // Almacenará los datos del producto cargado

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

    if (!window.db || !window.doc || !window.getDoc) {
        setTimeout(loadProductDetails, 100); 
        return;
    }

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    
    try {
        const productDocRef = window.doc(window.db, `artifacts/${appId}/public/data/productos`, currentProductId);
        const productSnap = await window.getDoc(productDocRef);

        if (productSnap.exists()) {
            // ¡CORRECCIÓN! Guardamos los datos del producto en la variable global
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
    // Eliminamos los campos que no son especificaciones para no mostrarlos dos veces
    delete specs.id; delete specs.nombre; delete specs.marca; delete specs.precio; delete specs.descripcion; delete specs.image; delete specs.categoria;

    if (Object.keys(specs).length > 0) {
        for (const key in specs) {
            specsHtml += `<li><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${specs[key]}</li>`;
        }
    } else {
        specsHtml += '<li>No hay especificaciones adicionales disponibles.</li>';
    }
    specsHtml += '</ul>';
    DOMElements.specs.innerHTML = specsHtml;

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
    // Esta función ahora encontrará los datos en 'currentProductData'
    if (!currentProductData) {
        alert("Error: No hay datos del producto.");
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
    DOMElements.qtyMinus.addEventListener('click', () => updateQuantity(-1));
    DOMElements.qtyPlus.addEventListener('click', () => updateQuantity(1));
    DOMElements.addToCartBtn.addEventListener('click', addProductToCart);
}

function initDetailPage() {
    loadProductDetails();
    setupEventListeners();
}

initDetailPage();