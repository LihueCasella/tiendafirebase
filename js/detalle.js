// js/detalle.js (Versión Final y Robusta)
// Espera la señal "firebase-ready" antes de ejecutarse.

// ----------------------------------------------------
// 1. DEFINICIÓN DE FUNCIONES PRINCIPALES
// ----------------------------------------------------

let currentProductData = null;

// Función para mostrar un mensaje de error en la página
function displayError(message) {
    const loadingMessage = document.getElementById('loading-message');
    const productContent = document.getElementById('product-content');
    if (loadingMessage) {
        loadingMessage.textContent = `Error: ${message}`;
        loadingMessage.style.color = 'red';
        loadingMessage.classList.remove('hidden');
    }
    if (productContent) {
        productContent.classList.add('hidden');
    }
    console.error(message); // También loguea en consola para debug
}

// Función para cargar los detalles del producto desde Firestore
async function loadProductDetails() {
    const productId = new URLSearchParams(window.location.search).get('id');
    if (!productId) {
        return displayError("No se ha proporcionado un ID de producto en la URL.");
    }

    if (!window.db || !window.getDoc || !window.doc) {
        return displayError("La conexión con la base de datos (Firebase) no está disponible.");
    }
    
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

    try {
        const productDocRef = window.doc(window.db, `artifacts/${appId}/public/data/productos`, productId);
        const productSnap = await window.getDoc(productDocRef);

        if (productSnap.exists()) {
            currentProductData = { id: productSnap.id, ...productSnap.data() };
            renderProduct(currentProductData);
        } else {
            displayError(`El producto con ID "${productId}" no se encontró en la base de datos.`);
        }
    } catch (error) {
        displayError("Ocurrió un error al consultar la base de datos.");
        console.error("Error en getDoc:", error);
    }
}

// Función para pintar la información del producto en el DOM
function renderProduct(product) {
    document.getElementById('page-title').textContent = `${product.nombre} | MegaStore`;
    document.getElementById('detail-main-image').src = product.image || 'https://placehold.co/500x400/eeeeee/333333?text=Sin+Imagen';
    document.getElementById('detail-main-image').alt = product.nombre;
    document.getElementById('detail-name').textContent = product.nombre;
    document.getElementById('detail-brand').textContent = product.marca ? `Marca: ${product.marca}` : 'Marca no disponible';
    document.getElementById('detail-price').textContent = (Number(product.precio) || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    document.getElementById('detail-description').textContent = product.descripcion || 'Este producto no tiene descripción.';
    
    // Lógica para las especificaciones (si aplica)
    // ... (puedes añadirla si es necesario)

    document.getElementById('loading-message').classList.add('hidden');
    document.getElementById('product-content').classList.remove('hidden');
    document.getElementById('add-to-cart-btn').disabled = false;
}

// ----------------------------------------------------
// 2. LÓGICA DEL CARRITO Y EVENTOS
// ----------------------------------------------------

function setupActionButtons() {
    const addToCartBtn = document.getElementById('add-to-cart-btn');
    const qtyInput = document.getElementById('qty-input');
    const qtyPlus = document.getElementById('qty-plus');
    const qtyMinus = document.getElementById('qty-minus');

    if (addToCartBtn) {
        addToCartBtn.addEventListener('click', () => {
            if (!currentProductData) {
                alert("Error: Los datos del producto no están cargados.");
                return;
            }
            const quantity = parseInt(qtyInput.value) || 1;
            // Aquí iría la lógica para añadir al carrito (usando LocalStorage, por ejemplo)
            alert(`Añadido al carrito: ${quantity} x ${currentProductData.nombre}`);
        });
    }
    
    if (qtyPlus) qtyPlus.addEventListener('click', () => { 
        let current = parseInt(qtyInput.value);
        qtyInput.value = current + 1;
    });
    
    if (qtyMinus) qtyMinus.addEventListener('click', () => { 
        let current = parseInt(qtyInput.value);
        if (current > 1) qtyInput.value = current - 1;
    });
}


// ----------------------------------------------------
// 3. PUNTO DE ENTRADA: ESPERAR LA SEÑAL DE FIREBASE
// ----------------------------------------------------

function main() {
    console.log("Señal 'firebase-ready' recibida. Ejecutando lógica de la página de detalle.");
    document.getElementById('add-to-cart-btn').disabled = true;
    loadProductDetails();
    setupActionButtons();
}

// El script espera a que el evento "firebase-ready" sea disparado desde el HTML.
document.addEventListener('firebase-ready', main);

