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

function renderProducts(productsToRender) {
    // Si no encontramos el productGrid (ej. en otra página), no hacemos nada.
    if (!productGrid) return;

    productGrid.innerHTML = ''; // Limpia la grilla antes de renderizar

    productsToRender.forEach(product => {
        const cardHTML = `
            <a href="detalle.html?id=${product.id}" class="product-card-link">
                <article class="product-card" data-id="${product.id}" data-category="${product.category}">
                    <img src="${product.image}" alt="${product.name}" onerror="this.src='placeholder.jpg';">
                    <div class="product-info">
                        <p class="product-name">${product.name}</p>
                        <p class="product-price">$${product.price.toLocaleString('es-AR')}</p>
                        <button class="btn btn-small add-to-cart" data-id="${product.id}">Añadir al Carrito</button>
                    </div>
                </article>
            </a>
        `;
        productGrid.innerHTML += cardHTML;
    });

    document.querySelectorAll('.add-to-cart').forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const productId = parseInt(e.target.dataset.id);
            addToCart(productId);
        });
    });
}

// ----------------------------------------------------
// 4. LÓGICA DE DATOS
// ----------------------------------------------------

function getProducts(category = 'tecnologia') {
    const filteredProducts = allProducts.filter(p => p.category === category);
    renderProducts(filteredProducts);
}

// ----------------------------------------------------
// 5. MANEJO DE PESTAÑAS (Tabs de Categoría)
// ----------------------------------------------------

if (tabButtons.length > 0) {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const newCategory = button.textContent.trim().toLowerCase().split(' ')[0];
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            getProducts(newCategory);
        });
    });
}

// ----------------------------------------------------
// 6. LÓGICA BÁSICA DEL CARRITO (Usando localStorage)
// ----------------------------------------------------

const getCart = () => {
    const cart = localStorage.getItem('cart');
    return cart ? JSON.parse(cart) : [];
}

const saveCart = (cart) => {
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
}

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

function updateCartCount() {
    if (!cartIcon) return;
    const cart = getCart();
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartIcon.textContent = `🛒 Carrito (${totalItems})`;
}

// ----------------------------------------------------
// 7. INICIALIZACIÓN DE LA APLICACIÓN
// ----------------------------------------------------

// Cargar la pestaña inicial (Tecnología) por defecto en la página de inicio.
// Esto se ejecuta en cuanto el script carga, que es después de que el DOM esté listo.
if (document.querySelector('.product-grid')) {
    getProducts('tecnologia'); 
}

// Inicializar el contador del carrito en todas las páginas.
updateCartCount();
