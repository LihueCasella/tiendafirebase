// js/detalle.js
// Lógica principal para la página de detalle del producto.

// ----------------------------------------------------
// 1. SIMULACIÓN DE DATOS (PARA COINCIDIR CON app.js)
//    Estos datos simulan lo que obtendrás de la base de datos
// ----------------------------------------------------

// Para que la página de detalle funcione con la de inicio, usamos la misma fuente de datos simulada.
// Se han añadido campos como 'brand', 'description' y 'specs' para que la página de detalle se vea completa.
const allProducts = [
    { 
        id: 1, name: 'Mouse Glorious Model O 2', price: 132650, category: 'tecnologia', 
        image: 'images/mouse-glorious.jpg', brand: 'Glorious', 
        description: 'Experimenta un rendimiento inigualable con el mouse para juegos Glorious Model O 2, diseñado para ser ultraligero y preciso. Perfecto para largas sesiones de juego competitivo.',
        specs: { 'Sensor': 'BAMF 2.0 26K', 'Peso': '59g', 'Switch': 'Glorious Switches (80M clics)', 'Conectividad': 'Inalámbrico 2.4GHz' }
    },
    { 
        id: 2, name: 'Teclado Mecánico RGB', price: 168450, category: 'tecnologia', 
        image: 'images/teclado-ejemplo.jpg', brand: 'KeyChron',
        description: 'Un teclado mecánico 75% con retroiluminación RGB, switches intercambiables en caliente y una construcción de aluminio premium para una experiencia de escritura superior.',
        specs: { 'Formato': '75%', 'Material': 'Aluminio', 'Switches': 'Gateron Red', 'RGB': 'Sí, por tecla' }
    },
    { 
        id: 3, name: 'Chaqueta de Cuero Urbana', price: 95000, category: 'indumentaria', 
        image: 'images/chaqueta-ejemplo.jpg', brand: 'UrbanStyle',
        description: 'Un clásico atemporal. Esta chaqueta de cuero sintético de alta calidad ofrece un estilo rebelde y sofisticado, perfecta para cualquier ocasión.',
        specs: { 'Material': 'Cuero sintético PU', 'Forro': 'Poliéster', 'Cierre': 'Cremallera metálica', 'Bolsillos': '3 exteriores, 1 interior' }
    },
    { 
        id: 4, name: 'Jeans Slim Fit Hombre', price: 45000, category: 'indumentaria', 
        image: 'images/jeans-ejemplo.jpg', brand: 'Denim Co.',
        description: 'Jeans cómodos y duraderos con un corte slim fit que se adapta a tu figura. Hechos con una mezcla de algodón y elastano para mayor flexibilidad.',
        specs: { 'Corte': 'Slim Fit', 'Material': '98% Algodón, 2% Elastano', 'Talles': '28 a 42', 'Origen': 'Nacional' }
    },
    { 
        id: 5, name: 'Sillón Nórdico Individual', price: 280000, category: 'hogar', 
        image: 'images/sillon-ejemplo.jpg', brand: 'HogarDeco',
        description: 'Añade un toque de elegancia y confort a tu sala de estar con este sillón de estilo nórdico, tapizado en tela de lino de alta resistencia y patas de madera maciza.',
        specs: { 'Estilo': 'Nórdico', 'Material': 'Lino y Madera de Paraíso', 'Dimensiones': '80cm x 75cm x 90cm', 'Colores': 'Gris, Beige, Azul' }
    },
    { 
        id: 6, name: 'Juego de Sábanas King Size', price: 65000, category: 'hogar', 
        image: 'images/sabanas-ejemplo.jpg', brand: 'SueñoReal',
        description: 'Duerme como nunca antes con nuestro juego de sábanas de 400 hilos de algodón egipcio. Suavidad y frescura garantizadas para un descanso reparador.',
        specs: { 'Tamaño': 'King Size (2x2m)', 'Material': '100% Algodón Egipcio', 'Hilos': '400', 'Incluye': 'Sábana, Sábana ajustable, 2 fundas' }
    },
    { 
        id: 7, name: 'Monitor 27" Curvo 144Hz', price: 450000, category: 'tecnologia', 
        image: 'images/monitor-ejemplo.jpg', brand: 'GamerTech',
        description: 'Sumérgete en la acción con este monitor curvo de 27 pulgadas. Su tasa de refresco de 144Hz y 1ms de tiempo de respuesta te darán la ventaja competitiva que necesitas.',
        specs: { 'Panel': 'VA Curvo 1500R', 'Resolución': '1920x1080', 'Tasa de Refresco': '144Hz', 'Tiempo de Respuesta': '1ms' }
    },
];

// ----------------------------------------------------
// 2. VARIABLES GLOBALES Y DOM
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
// 3. FUNCIONES PRINCIPALES
// ----------------------------------------------------

function getProductIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

function showContent() {
    DOMElements.loadingMessage.classList.add('hidden');
    DOMElements.productContent.classList.remove('hidden');
}

function displayError(message) {
    DOMElements.loadingMessage.textContent = `Error: ${message}`;
    DOMElements.loadingMessage.style.color = 'red';
    DOMElements.productContent.classList.add('hidden');
}

/**
 * Carga el producto desde la lista simulada usando su ID.
 */
function loadProductDetails() {
    currentProductId = getProductIdFromURL();

    if (!currentProductId) {
        displayError("ID de producto no especificado en la URL.");
        return;
    }

    // Buscamos el producto en nuestra lista local.
    // Usamos `==` en lugar de `===` porque el ID de la URL es un string y en el array es un número.
    const product = allProducts.find(p => p.id == currentProductId);

    if (product) {
        currentProductData = product; // Guardamos los datos para usarlos después (ej. al añadir al carrito)
        renderProduct(product);
    } else {
        displayError(`El producto con ID "${currentProductId}" no existe.`);
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

// ----------------------------------------------------
// 4. LÓGICA DEL CARRITO Y COMPRA (USA LOCALSTORAGE)
// ----------------------------------------------------

// Adaptamos las funciones del carrito para que usen localStorage, igual que en app.js
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
            quantity: quantityToAdd 
        });
    }

    saveCart(cart);
    alert(`¡${quantityToAdd} unidad(es) de "${currentProductData.name}" se han añadido al carrito!`);
    
    // Opcional: Actualizar el contador del header si estuviera visible en esta página.
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
