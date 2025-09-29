// js/detalle.js (Versión Definitiva)

// --- MAPA DE IMÁGENES DE PRODUCTOS (CORREGIDO Y VERIFICADO) ---
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
    console.error(message);
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
    
    const appId = typeof window.__app_id !== 'undefined' ? window.__app_id : 'default-app-id';
    if (appId === 'default-app-id') {
        console.warn("No se encontró `__app_id` en `window`. Usando valor por defecto.");
    }

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
    document.getElementById('detail-main-image').src = productImageMap[product.nombre] || product.image || 'https://placehold.co/500x400/eeeeee/333333?text=Sin+Imagen';
    document.getElementById('detail-main-image').alt = product.nombre;
    document.getElementById('detail-name').textContent = product.nombre;
    document.getElementById('detail-brand').textContent = product.marca ? `Marca: ${product.marca}` : 'Marca no disponible';
    document.getElementById('detail-price').textContent = (Number(product.precio) || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    document.getElementById('detail-description').textContent = product.descripcion || 'Este producto no tiene descripción.';
    
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
            const cart = JSON.parse(localStorage.getItem('cart')) || [];
            const existingProductIndex = cart.findIndex(item => item.id === currentProductData.id);
            if (existingProductIndex > -1) {
                cart[existingProductIndex].cantidad += quantity;
            } else {
                cart.push({ ...currentProductData, cantidad: quantity });
            }
            localStorage.setItem('cart', JSON.stringify(cart));
            alert(`Añadido al carrito: ${quantity} x ${currentProductData.nombre}`);
        });
    }
    
    if (qtyPlus) qtyPlus.addEventListener('click', () => { 
        qtyInput.value = parseInt(qtyInput.value) + 1;
    });
    
    if (qtyMinus) qtyMinus.addEventListener('click', () => { 
        let current = parseInt(qtyInput.value);
        if (current > 1) qtyInput.value = current - 1;
    });
}


// ----------------------------------------------------
// 3. PUNTO DE ENTRADA (CON LÓGICA ANTI-RACE-CONDITION)
// ----------------------------------------------------

function initDetailPage() {
    console.log("Ejecutando lógica de la página de detalle.");
    document.getElementById('add-to-cart-btn').disabled = true;
    loadProductDetails();
    setupActionButtons();
}

// Comprobamos si Firebase ya está listo.
if (window.db) {
    // Si ya está listo, ejecuta la lógica de la página inmediatamente.
    initDetailPage();
} else {
    // Si no, espera a la señal 'firebase-ready'.
    document.addEventListener('firebase-ready', initDetailPage);
}
