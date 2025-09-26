// js/productos.js
// Lógica principal para la página de listado de productos y manejo del carrito.

// ----------------------------------------------------
// 1. VARIABLES GLOBALES DE ESTADO Y DOM
// ----------------------------------------------------

// Estado actual de los filtros
const currentFilters = {
    category: '',
    minPrice: 0,
    maxPrice: Infinity,
    brands: [],
    sortBy: 'default' // 'price_asc', 'price_desc', 'name_asc'
};

const DOMElements = {
    listingGrid: document.getElementById('product-listing-grid'),
    listingTitle: document.getElementById('listing-title'),
    categoryTitle: document.getElementById('current-category-title'),
    minPriceInput: document.getElementById('min-price'),
    maxPriceInput: document.getElementById('max-price'),
    applyPriceBtn: document.getElementById('apply-price-filter'),
    brandFilters: document.getElementById('brand-filters'),
    sortBySelect: document.getElementById('sort-by'),
    specificFiltersGroup: document.getElementById('specific-filter-group')
};

// ----------------------------------------------------
// 2. UTILIDADES Y LÓGICA DEL CARRITO
// ----------------------------------------------------

/**
 * Lee la URL para obtener el parámetro 'cat' (categoría).
 * @returns {string} La categoría actual (ej: 'tecnologia').
 */
function getCategoryFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    // Devuelve 'tecnologia' por defecto si no se especifica.
    return urlParams.get('cat') || 'tecnologia';
}

/**
 * Agrega un producto al carrito del usuario en Firestore.
 * Utiliza la colección privada del usuario: /artifacts/{appId}/users/{userId}/carrito
 * @param {string} productId - ID del producto a agregar.
 */
async function addToCart(productId) {
    // ⚠️ COMPROBACIÓN: Asegurar que Firebase esté listo y el usuario autenticado
    if (!window.db || !window.auth.currentUser) {
        console.error("Firebase DB o autenticación no disponible.");
        alert("Necesitas estar conectado para añadir productos al carrito."); // Usar un modal en producción
        return;
    }

    const userId = window.auth.currentUser.uid;
    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    
    // Ruta del documento del carrito para el usuario actual
    const cartDocRef = window.doc(window.db, `artifacts/${appId}/users/${userId}/carrito/items`);

    try {
        // En un carrito real, buscamos el producto. 
        // Para simplificar, asumimos que el documento del carrito contiene un mapa de productos.
        
        // 1. Obtener el producto actual de Firestore (solo para obtener su precio/nombre)
        // Nota: En una aplicación real, se usaría un mapa para evitar lecturas extra.
        // Aquí hacemos una consulta para simular la obtención de datos del producto.
        const productRef = window.doc(window.db, `artifacts/${appId}/public/data/productos`, productId);
        const productSnap = await window.getDoc(productRef); // Usamos getDoc sincrónico
        
        if (!productSnap.exists()) {
            console.error(`Producto con ID ${productId} no encontrado.`);
            return;
        }

        const productData = productSnap.data();
        
        // 2. Actualizar el carrito (usando setDoc con merge: true para actualizar sin borrar)
        await window.setDoc(cartDocRef, {
            [productId]: { // Usamos el ID del producto como clave del mapa
                id: productId,
                name: productData.name,
                price: productData.price,
                // Simulamos que siempre se añade 1 unidad. En el futuro, se actualizaría la cantidad.
                quantity: window.increment(1), 
                addedAt: window.serverTimestamp() // Para saber cuándo se añadió
            }
        }, { merge: true }); // Merge: si el producto ya existe, se actualiza la cantidad

        console.log(`Producto ${productData.name} añadido/actualizado en el carrito de ${userId}`);
        
        // Mostrar un mensaje de éxito al usuario (usar un modal, no alert)
        alert(`¡"${productData.name}" añadido al carrito!`); 

    } catch (error) {
        console.error("Error al añadir producto al carrito:", error);
        alert("Ocurrió un error al intentar añadir el producto.");
    }
}


/**
 * Inicializa los listeners para los botones "Añadir al Carrito" después de renderizar.
 */
function setupCartEventListeners() {
    // Escucha eventos de clic en la grilla para los botones 'add-to-cart'
    DOMElements.listingGrid.addEventListener('click', (e) => {
        const button = e.target.closest('.add-to-cart');
        if (button) {
            const productId = button.dataset.id;
            addToCart(productId);
        }
    });
}


/**
 * Renderiza los productos en la grilla.
 * @param {Array} productsToRender - Lista de productos ya filtrados.
 */
function renderProducts(productsToRender) {
    if (!DOMElements.listingGrid) return;

    DOMElements.listingGrid.innerHTML = ''; // Limpiar grilla

    if (productsToRender.length === 0) {
        DOMElements.listingGrid.innerHTML = '<p class="w-full text-center py-10 text-gray-500">No se encontraron productos con los filtros seleccionados.</p>';
        return;
    }

    productsToRender.forEach(product => {
        const priceNumber = Number(product.price) || 0;
        const formattedPrice = priceNumber.toLocaleString('es-AR');

        const cardHTML = `
            <article class="product-card" data-id="${product.id}" data-category="${product.category}">
                <img src="${product.image || 'https://placehold.co/250x200/cccccc/333333?text=Sin+Imagen'}" alt="${product.name}" onerror="this.src='https://placehold.co/250x200/cccccc/333333?text=Error';">
                <div class="product-info">
                    <p class="product-name">${product.name}</p>
                    <p class="product-price">$${formattedPrice}</p>
                    <button class="btn btn-small add-to-cart" data-id="${product.id}">Añadir al Carrito</button>
                </div>
            </article>
        `;
        DOMElements.listingGrid.innerHTML += cardHTML;
    });

    // Actualizar el título de la página
    const categoryName = currentFilters.category.charAt(0).toUpperCase() + currentFilters.category.slice(1);
    DOMElements.listingTitle.textContent = `Listado de Productos: ${categoryName}`;
    DOMElements.categoryTitle.textContent = `Categoría: ${categoryName}`;

    // NO necesitamos llamar a setupCartEventListeners aquí, ya que el listener está en la grilla (delegación de eventos)
}

/**
 * Filtra y ordena un array de productos en el lado del cliente.
 * Se usa para filtros que Firebase no maneja bien (ej: OR en múltiples marcas, o filtros de texto).
 * @param {Array} products - Lista de todos los productos de la categoría.
 * @returns {Array} Los productos filtrados y ordenados.
 */
function filterAndSortProducts(products) {
    let filtered = products;
    const filters = currentFilters;

    // 1. Filtrar por marcas
    if (filters.brands.length > 0) {
        filtered = filtered.filter(p => filters.brands.includes(p.brand));
    }

    // 2. (Aquí iría la lógica de filtros específicos: talla, capacidad, etc.)

    // 3. Ordenar
    if (filters.sortBy !== 'default') {
        filtered.sort((a, b) => {
            const priceA = Number(a.price) || 0;
            const priceB = Number(b.price) || 0;

            if (filters.sortBy === 'price_asc') {
                return priceA - priceB;
            } else if (filters.sortBy === 'price_desc') {
                return priceB - priceA;
            } else if (filters.sortBy === 'name_asc') {
                return a.name.localeCompare(b.name);
            }
            return 0;
        });
    }

    return filtered;
}

// ----------------------------------------------------
// 3. CONSULTA A FIRESTORE Y MANEJO DE QUERIES
// ----------------------------------------------------

/**
 * Consulta la base de datos de Firebase con los filtros actuales y usa onSnapshot.
 */
function loadProducts() {
    // ⚠️ COMPROBACIÓN CRÍTICA: Asegurar que Firebase esté listo
    if (!window.db || !window.collection || !window.onSnapshot || !window.where) {
        DOMElements.listingGrid.innerHTML = '<p class="w-full text-center py-10 text-red-500">Error: Conexión con Firebase no iniciada.</p>';
        return;
    }

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const productsCollectionRef = window.collection(window.db, `artifacts/${appId}/public/data/productos`);
    
    // Construir la Query de Firebase
    let productQuery = window.query(
        productsCollectionRef,
        window.where('category', '==', currentFilters.category) // Filtro obligatorio por categoría
    );
    
    // El filtro de rango de precio se hace en el cliente para evitar problemas de índice.

    // Listener de Tiempo Real
    window.onSnapshot(productQuery, (snapshot) => {
        const allProducts = [];
        snapshot.forEach(doc => {
            // Incluir el ID para futuras operaciones
            allProducts.push({ id: doc.id, ...doc.data() }); 
        });

        // Aplicar filtros adicionales (precio, marca, ordenación) en el cliente
        const finalProducts = allProducts
            .filter(p => (p.price || 0) >= currentFilters.minPrice)
            .filter(p => (p.price || 0) <= currentFilters.maxPrice);

        const filteredAndSorted = filterAndSortProducts(finalProducts);

        renderProducts(filteredAndSorted);

    }, (error) => {
        console.error("Error al escuchar productos:", error);
        DOMElements.listingGrid.innerHTML = '<p class="w-full text-center py-10 text-red-500">Error: No se pudo cargar la base de datos.</p>';
    });
}

// ----------------------------------------------------
// 4. MANEJO DE EVENTOS DE FILTRADO
// ----------------------------------------------------

/**
 * Inicializa los Event Listeners para la barra lateral.
 */
function setupEventListeners() {
    
    // 1. Filtro de Precio
    DOMElements.applyPriceBtn.addEventListener('click', () => {
        const min = parseFloat(DOMElements.minPriceInput.value) || 0;
        const max = parseFloat(DOMElements.maxPriceInput.value) || Infinity;

        currentFilters.minPrice = min;
        currentFilters.maxPrice = max;

        // Vuelve a cargar y aplicar filtros (sin llamar a loadProducts, solo re-renderiza)
        loadProducts(); 
    });

    // 2. Filtro de Marca (Checkbox)
    DOMElements.brandFilters.addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            const selectedBrands = Array.from(DOMElements.brandFilters.querySelectorAll('input:checked'))
                                      .map(cb => cb.value);
            currentFilters.brands = selectedBrands;
            loadProducts();
        }
    });

    // 3. Ordenación
    DOMElements.sortBySelect.addEventListener('change', (e) => {
        currentFilters.sortBy = e.target.value;
        loadProducts(); 
    });
}

// ----------------------------------------------------
// 5. INICIALIZACIÓN
// ----------------------------------------------------

/**
 * Función que se ejecuta al cargar la página.
 */
function initProductPage() {
    // 1. Obtener la categoría inicial de la URL
    currentFilters.category = getCategoryFromURL();

    // 2. Cargar los Event Listeners para los filtros
    setupEventListeners();

    // 3. Cargar los Event Listeners del Carrito
    setupCartEventListeners();

    // 4. Iniciar la consulta a Firebase (onSnapshot)
    loadProducts();

    // 5. Actualizar el estado visual del menú principal
    const menuItems = document.querySelectorAll('.main-menu .menu-item');
    menuItems.forEach(item => {
        if (item.dataset.category === currentFilters.category) {
            item.classList.add('active'); // Usar la clase CSS 'active' para resaltarlo
        } else {
            item.classList.remove('active');
        }
    });

    // 6. Renderizar filtros específicos (simulación)
    renderSpecificFilters(currentFilters.category);
}


/**
 * Renderiza filtros adicionales basados en la categoría.
 * Esto es importante porque 'Tecnología' necesita 'Memoria RAM', e 'Indumentaria' necesita 'Talla'.
 */
function renderSpecificFilters(category) {
    let html = '';
    
    if (category === 'tecnologia') {
        html = `
            <h4><i class="fas fa-microchip"></i> Especificaciones</h4>
            <ul class="filter-list">
                <li><label><input type="checkbox" data-filter="ram" value="8GB"> 8GB RAM</label></li>
                <li><label><input type="checkbox" data-filter="ram" value="16GB"> 16GB RAM</label></li>
                <li><label><input type="checkbox" data-filter="disco" value="SSD"> SSD</label></li>
            </ul>
        `;
    } else if (category === 'indumentaria') {
        html = `
            <h4><i class="fas fa-ruler"></i> Talla</h4>
            <ul class="filter-list">
                <li><label><input type="checkbox" data-filter="talla" value="S"> S</label></li>
                <li><label><input type="checkbox" data-filter="talla" value="M"> M</label></li>
                <li><label><input type="checkbox" data-filter="talla" value="L"> L</label></li>
            </ul>
            <h4><i class="fas fa-palette"></i> Color</h4>
            <ul class="filter-list">
                <li><label><input type="checkbox" data-filter="color" value="Rojo"> Rojo</label></li>
                <li><label><input type="checkbox" data-filter="color" value="Azul"> Azul</label></li>
            </ul>
        `;
    } else if (category === 'hogar') {
        html = `
            <h4><i class="fas fa-couch"></i> Material</h4>
            <ul class="filter-list">
                <li><label><input type="checkbox" data-filter="material" value="Madera"> Madera</label></li>
                <li><label><input type="checkbox" data-filter="material" value="Metal"> Metal</label></li>
            </ul>
        `;
    }

    DOMElements.specificFiltersGroup.innerHTML = html;
    // Note: Aquí se añadirían los listeners a estos nuevos checkboxes si se necesita filtrado avanzado.
}


// Ejecutar la función principal al cargar el script
initProductPage();
