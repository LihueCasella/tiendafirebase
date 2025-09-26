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
    
    // Elementos de la información
    mainImage: document.getElementById('detail-main-image'),
    name: document.getElementById('detail-name'),
    brand: document.getElementById('detail-brand'),
    price: document.getElementById('detail-price'),
    description: document.getElementById('detail-description'),
    specs: document.getElementById('detail-specs'),
    
    // Elementos de la compra
    qtyMinus: document.getElementById('qty-minus'),
    qtyPlus: document.getElementById('qty-plus'),
    qtyInput: document.getElementById('qty-input'),
    addToCartBtn: document.getElementById('add-to-cart-btn')
};

// ----------------------------------------------------
// 2. UTILIDADES
// ----------------------------------------------------

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
    DOMElements.loadingMessage.classList.add('hidden');
    DOMElements.productContent.classList.remove('hidden');
}

/**
 * Muestra un error en la interfaz.
 * @param {string} message - Mensaje de error a mostrar.
 */
function displayError(message) {
    DOMElements.loadingMessage.textContent = `Error: ${message}`;
    DOMElements.loadingMessage.style.color = 'red';
    DOMElements.productContent.classList.add('hidden');
}

// ----------------------------------------------------
// 3. CONSULTA A FIRESTORE Y RENDERIZADO
// ----------------------------------------------------

/**
 * Carga el producto desde Firestore usando su ID.
 */
async function loadProductDetails() {
    currentProductId = getProductIdFromURL();

    if (!currentProductId) {
        displayError("ID de producto no especificado en la URL.");
        return;
    }

    if (!window.db || !window.doc || !window.getDoc) {
        displayError("Conexión con Firebase no iniciada.");
        return;
    }

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    
    try {
        // Referencia al documento específico del producto
        const productDocRef = window.doc(window.db, `artifacts/${appId}/public/data/productos`, currentProductId);
        const productSnap = await window.getDoc(productDocRef);

        if (productSnap.exists()) {
            currentProductData = productSnap.data();
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

    // Renderizar especificaciones
    let specsHtml = '<h4>Especificaciones Clave</h4><ul>';
    // Asumimos que las especificaciones están en un objeto 'specs' dentro del producto
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

// ----------------------------------------------------
// 4. LÓGICA DEL CARRITO Y COMPRA
// ----------------------------------------------------

/**
 * Incrementa o decrementa la cantidad seleccionada.
 * @param {number} delta - +1 para aumentar, -1 para disminuir.
 */
function updateQuantity(delta) {
    let currentQty = parseInt(DOMElements.qtyInput.value) || 1;
    let newQty = currentQty + delta;

    if (newQty < 1) newQty = 1;
    // Podrías añadir un límite máximo aquí si tuvieras el stock

    DOMElements.qtyInput.value = newQty;
}

/**
 * Agrega el producto al carrito del usuario con la cantidad seleccionada.
 */
async function addProductToCart() {
    if (!currentProductData || !currentProductId) {
        alert("Primero debe cargar un producto válido.");
        return;
    }

    if (!window.auth.currentUser) {
        alert("Necesitas estar conectado para añadir productos al carrito.");
        return;
    }

    const quantityToAdd = parseInt(DOMElements.qtyInput.value) || 1;
    if (quantityToAdd < 1) {
        alert("La cantidad debe ser al menos 1.");
        return;
    }

    const userId = window.auth.currentUser.uid;
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    
    // Ruta del documento del carrito para el usuario
    const cartDocRef = window.doc(window.db, `artifacts/${appId}/users/${userId}/carrito/items`);

    DOMElements.addToCartBtn.disabled = true;
    DOMElements.addToCartBtn.textContent = 'Añadiendo...';

    try {
        await window.setDoc(cartDocRef, {
            [currentProductId]: { 
                id: currentProductId,
                name: currentProductData.name,
                price: currentProductData.price,
                // Usamos increment para añadir la cantidad seleccionada
                quantity: window.increment(quantityToAdd), 
                addedAt: window.serverTimestamp()
            }
        }, { merge: true });

        alert(`¡${quantityToAdd} unidad(es) de "${currentProductData.name}" añadidas al carrito!`); 

    } catch (error) {
        console.error("Error al añadir producto al carrito:", error);
        alert("Ocurrió un error al intentar añadir el producto.");
    } finally {
        DOMElements.addToCartBtn.disabled = false;
        DOMElements.addToCartBtn.textContent = 'Añadir al Carrito';
    }
}


// ----------------------------------------------------
// 5. INICIALIZACIÓN
// ----------------------------------------------------

/**
 * Inicializa los Event Listeners.
 */
function setupEventListeners() {
    // Control de Cantidad
    DOMElements.qtyMinus.addEventListener('click', () => updateQuantity(-1));
    DOMElements.qtyPlus.addEventListener('click', () => updateQuantity(1));
    
    // Botón Añadir al Carrito
    DOMElements.addToCartBtn.addEventListener('click', addProductToCart);
}

/**
 * Función que se ejecuta al cargar la página.
 */
function initDetailPage() {
    // 1. Cargar la información del producto de Firebase
    loadProductDetails();

    // 2. Configurar los controles de cantidad y el botón de compra
    setupEventListeners();
}


// Ejecutar la función principal al cargar el script
initDetailPage();
