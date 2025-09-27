// js/detalle.js
// Lógica principal para la página de detalle del producto.

// ----------------------------------------------------\n// 1. VARIABLES GLOBALES Y DOM\n// ----------------------------------------------------\

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

// ----------------------------------------------------\n// 2. UTILIDADES\n// ----------------------------------------------------

/**
 * Lee la URL para obtener el parámetro 'id' (ID del producto).
 * @returns {string | null} El ID del producto o null si no se encuentra.
 */
function getProductIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Muestra el contenido del producto y oculta el mensaje de carga.
 */
function showContent() {
    if (DOMElements.loadingMessage) DOMElements.loadingMessage.classList.add('hidden');
    if (DOMElements.productContent) DOMElements.productContent.classList.remove('hidden');
}

/**
 * Muestra un error en la interfaz.
 * @param {string} message - Mensaje de error a mostrar.
 */
function displayError(message) {
    if (DOMElements.loadingMessage) {
        DOMElements.loadingMessage.textContent = `Error: ${message}`;
        DOMElements.loadingMessage.style.color = 'red';
    }
    if (DOMElements.productContent) DOMElements.productContent.classList.add('hidden');
}

// ----------------------------------------------------\n// 3. CONSULTA A FIRESTORE Y RENDERIZADO\n// ----------------------------------------------------

/**
 * Carga el producto desde Firestore usando su ID.
 */
async function loadProductDetails() {
    currentProductId = getProductIdFromURL();

    if (!currentProductId) {
        displayError("ID de producto no especificado en la URL.");
        return;
    }

    // Espera a que la conexión con Firebase esté lista
    if (!window.db || !window.doc || !window.getDoc) {
        // Reintentar después de un breve retraso si Firebase no está listo
        setTimeout(loadProductDetails, 100); 
        return;
    }

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    
    try {
        const productDocRef = window.doc(window.db, `artifacts/${appId}/public/data/productos`, currentProductId);
        const productSnap = await window.getDoc(productDocRef);

        if (productSnap.exists()) {
            // Asignamos el ID del documento a los datos del producto.
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

/**
 * Renderiza la información del producto en los elementos DOM.
 * @param {object} product - Datos del producto cargado.
 */
function renderProduct(product) {
    const priceNumber = Number(product.price) || 0;
    const formattedPrice = priceNumber.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

    DOMElements.pageTitle.textContent = `${product.name} | MegaStore`;
    DOMElements.mainImage.src = product.image || 'https://placehold.co/500x400/eeeeee/333333?text=Sin+Imagen';
    DOMElements.mainImage.alt = product.name;
    DOMElements.name.textContent = product.name;
    DOMElements.brand.textContent = product.brand ? `Marca: ${product.brand}` : 'Marca no especificada';
    DOMElements.price.textContent = formattedPrice;
    DOMElements.description.textContent = product.description || 'Este producto no tiene una descripción detallada.';

    let specsHtml = '<h4>Especificaciones Clave</h4><ul>';
    if (product.specs && typeof product.specs === 'object') {
        for (const key in product.specs) {
            specsHtml += `<li><strong>${key.charAt(0).toUpperCase() + key.slice(1)}:</strong> ${product.specs[key]}</li>`;
        }
    } else {
        specsHtml += '<li>No hay especificaciones adicionales disponibles.</li>';
    }
    specsHtml += '</ul>';
    DOMElements.specs.innerHTML = specsHtml;

    showContent();
}

// ----------------------------------------------------\n// 4. LÓGICA DEL CARRITO Y COMPRA\n// ----------------------------------------------------

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
        alert("Error: No hay datos del producto.");
        return;
    }

    const quantityToAdd = parseInt(DOMElements.qtyInput.value) || 1;
    const cart = getCart();
    const productInCart = cart.find(item => item.id === currentProductData.id);

    if (productInCart) {
        productInCart.quantity += quantityToAdd;
    } else {
        cart.push({ 
            id: currentProductData.id, 
            name: currentProductData.name, 
            price: currentProductData.price,
            image: currentProductData.image,
            quantity: quantityToAdd 
        });
    }

    saveCart(cart);
    alert(`¡${quantityToAdd} unidad(es) de "${currentProductData.name}" se han añadido al carrito!`);
}


// ----------------------------------------------------\n// 5. INICIALIZACIÓN\n// ----------------------------------------------------

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
