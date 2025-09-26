// js/app.js

// ----------------------------------------------------
// 1. SELECCIÓN DE ELEMENTOS DEL DOM
// ----------------------------------------------------

// Contenedor de la grilla de productos
const productGrid = document.querySelector('.product-grid');
// Botones de las pestañas de categorías
const tabButtons = document.querySelectorAll('.tab-btn');
// Contador del carrito (ej. al lado del icono 🛒)
const cartIcon = document.querySelector('.cart-icon');

// ----------------------------------------------------
// 2. SIMULACIÓN DE DATOS (MIGRAR A FIRESTORE)
//    Estos datos simulan lo que obtendrás de la base de datos
// ----------------------------------------------------

const allProducts = [
    { id: 1, name: 'Mouse Glorious Model O 2', price: 132650, category: 'tecnologia', image: 'images/mouse-glorious.jpg' },
    { id: 2, name: 'Teclado Mecánico RGB', price: 168450, category: 'tecnologia', image: 'images/teclado-ejemplo.jpg' },
    { id: 3, name: 'Chaqueta de Cuero Urbana', price: 95000, category: 'indumentaria', image: 'images/chaqueta-ejemplo.jpg' },
    { id: 4, name: 'Jeans Slim Fit Hombre', price: 45000, category: 'indumentaria', image: 'images/jeans-ejemplo.jpg' },
    { id: 5, name: 'Sillón Nórdico Individual', price: 280000, category: 'hogar', image: 'images/sillon-ejemplo.jpg' },
    { id: 6, name: 'Juego de Sábanas King Size', price: 65000, category: 'hogar', image: 'images/sabanas-ejemplo.jpg' },
    { id: 7, name: 'Monitor 27" Curvo 144Hz', price: 450000, category: 'tecnologia', image: 'images/monitor-ejemplo.jpg' },
];

// ----------------------------------------------------
// 3. FUNCIONES DE RENDERING (Carga de Productos)
// ----------------------------------------------------

/**
 * Función que toma un array de productos y los inyecta en el DOM.
 * @param {Array} productsToRender - Lista de productos filtrados a mostrar.
 */
function renderProducts(productsToRender) {
    productGrid.innerHTML = ''; // Limpia la grilla antes de renderizar

    productsToRender.forEach(product => {
        const cardHTML = `
            <article class="product-card" data-id="${product.id}" data-category="${product.category}">
                <img src="${product.image}" alt="${product.name}" onerror="this.src='placeholder.jpg';">
                <div class="product-info">
                    <p class="product-name">${product.name}</p>
                    <p class="product-price">$${product.price.toLocaleString('es-AR')}</p>
                    <button class="btn btn-small add-to-cart" data-id="${product.id}">Añadir al Carrito</button>
                </div>
            </article>
        `;
        productGrid.innerHTML += cardHTML;
    });

    // Añade el Event Listener a los nuevos botones de carrito
    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            const productId = parseInt(e.target.dataset.id);
            addToCart(productId);
        });
    });
}

// ----------------------------------------------------
// 4. LÓGICA DE FIRESTORE (Cómo se vería la integración real)
// ----------------------------------------------------

/**
 * Función que obtendría los productos filtrados de Firestore.
 * NOTA: Esta función es solo una demostración. Usa la simulación 'allProducts' por ahora.
 */
async function getProductsFromFirestore(category = 'tecnologia') {
    // 1. Usar la simulación temporal
    const filteredProducts = allProducts.filter(p => p.category === category);
    renderProducts(filteredProducts);
    
    /* // 2. CÓDIGO REAL PARA FIRESTORE (descomentar y probar en el futuro)
    try {
        const productsRef = db.collection('productos');
        const querySnapshot = await productsRef.where('category', '==', category).get();
        
        const firestoreProducts = [];
        querySnapshot.forEach(doc => {
            firestoreProducts.push({ id: doc.id, ...doc.data() });
        });
        
        renderProducts(firestoreProducts);
    } catch (error) {
        console.error("Error al obtener productos de Firestore: ", error);
        // Opcional: mostrar un mensaje al usuario
    }
    */
}


// ----------------------------------------------------
// 5. MANEJO DE PESTAÑAS (Tabs de Categoría)
// ----------------------------------------------------

tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        // 1. Obtener la categoría a filtrar (el texto del botón en minúsculas)
        const newCategory = button.textContent.trim().toLowerCase().split(' ')[0]; 

        // 2. Actualizar estilos (botón activo)
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // 3. Cargar y renderizar los productos de esa categoría
        getProductsFromFirestore(newCategory);
    });
});

// ----------------------------------------------------
// 6. LÓGICA BÁSICA DEL CARRITO (Usando localStorage)
// ----------------------------------------------------

/**
 * Inicializa o recupera el carrito de localStorage.
 */
const getCart = () => {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

/**
 * Guarda el carrito en localStorage.
 */
const saveCart = (cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

/**
 * Añade un producto al carrito.
 */
function addToCart(productId) {
    const cart = getCart();
    const productExists = cart.find(item => item.id === productId);

    if (productExists) {
        productExists.quantity += 1;
    } else {
        const productData = allProducts.find(p => p.id === productId);
        if (productData) {
            cart.push({ id: productId, quantity: 1, name: productData.name, price: productData.price });
        }
    }
    
    saveCart(cart);
    alert(`Producto añadido: ${allProducts.find(p => p.id === productId).name}`);
}

/**
 * Actualiza el número de ítems en el icono del carrito.
 */
function updateCartCount() {
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    
    // Muestra el número al lado del icono 🛒
    cartIcon.textContent = `🛒 Carrito (${totalItems})`;
}

// ----------------------------------------------------
// 7. INICIALIZACIÓN DE LA APLICACIÓN
// ----------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar la pestaña inicial (Tecnología)
    getProductsFromFirestore('tecnologia'); 

    // 2. Inicializar el contador del carrito
    updateCartCount();
});