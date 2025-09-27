// ----------------------------------------------------
// Módulo: Lógica de Listado y Filtrado de Productos
// ----------------------------------------------------

// La función principal se define pero NO se llama inmediatamente.
// Esperará el evento 'firebase-ready' para asegurar que window.db y window.auth estén disponibles.
function initProductPage() {
    // Estas variables ahora deben estar disponibles globalmente (expuestas en productos.html)
    const { db, collection, query, where, onSnapshot, getDocs } = window;
    if (!db) {
        // En caso de fallo, mostramos un mensaje de error claro en el área de listado.
        console.error("Error: Conexión con Firebase no iniciada. db object is null.");
        document.getElementById('listing-loading-message').textContent = "Error: Conexión con Firebase no iniciada.";
        return;
    }

    const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const PRODUCTS_COLLECTION_PATH = `/artifacts/${APP_ID}/public/data/productos`;

    const urlParams = new URLSearchParams(window.location.search);
    let currentCategory = urlParams.get('cat') || 'all';
    let currentFilters = {};
    let currentSort = 'default';

    const productGridEl = document.getElementById('product-listing-grid');
    const titleEl = document.getElementById('listing-title');
    const sortEl = document.getElementById('sort-by');
    const specificFilterGroupEl = document.getElementById('specific-filter-group');
    const specificFilterListEl = specificFilterGroupEl.querySelector('ul');
    const brandFilterListEl = document.getElementById('brand-filters');
    const loadingMessageEl = document.getElementById('listing-loading-message');

    // ----------------------------------------------------
    // 1. RENDERING Y UTILIDADES
    // ----------------------------------------------------

    function getCategoryTitle(cat) {
        const titles = {
            'all': 'Todos los Productos',
            'tecnologia': 'Categoría: Tecnología',
            'indumentaria': 'Categoría: Indumentaria',
            'hogar': 'Categoría: Hogar',
            'otros': 'Otros Productos'
        };
        return titles[cat] || `Categoría: ${cat}`;
    }

    function renderProductCard(product) {
        // Usa una imagen placeholder si la URL no está definida
        const imageUrl = product.imagenUrl || `https://placehold.co/300x300/4CAF50/ffffff?text=${product.nombre.substring(0, 10)}`;
        return `
            <div class="product-card">
                <div class="product-image-container">
                    <img src="${imageUrl}" alt="${product.nombre}" onerror="this.onerror=null; this.src='https://placehold.co/300x300/888/ffffff?text=No+Image';">
                </div>
                <div class="product-details">
                    <h3 title="${product.nombre}">${product.nombre}</h3>
                    <p class="brand">${product.marca || 'Marca Desconocida'}</p>
                    <p class="price">$${product.precio.toFixed(2)}</p>
                    <button class="btn add-to-cart-btn">Añadir al Carrito</button>
                </div>
            </div>
        `;
    }

    function renderProducts(products) {
        productGridEl.innerHTML = '';
        if (products.length === 0) {
            productGridEl.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; padding: 50px;">No se encontraron productos que coincidan con los filtros aplicados.</p>';
            loadingMessageEl.style.display = 'none';
            return;
        }

        const html = products.map(renderProductCard).join('');
        productGridEl.innerHTML = html;
        loadingMessageEl.style.display = 'none';
    }

    // ----------------------------------------------------
    // 2. FILTRADO Y CONSULTA DE FIRESTORE
    // ----------------------------------------------------

    function buildQuery() {
        let q = collection(db, PRODUCTS_COLLECTION_PATH);
        const filters = [];

        // 1. Filtrar por Categoría (Si no es 'all')
        if (currentCategory !== 'all') {
            filters.push(where('categoria', '==', currentCategory));
        }

        // 2. Filtrar por Marca
        const selectedBrands = currentFilters.marca || [];
        if (selectedBrands.length > 0) {
            filters.push(where('marca', 'in', selectedBrands));
        }
        
        // *********
        // NOTA IMPORTANTE: FIRESTORE LIMITA LOS FILTROS '!=' Y REQUIERE ÍNDICES COMPUESTOS
        // Para evitar errores en este entorno, solo aplicaremos filtros '==' (categoría) y 'in' (marca).
        // Los filtros de precio y ordenamiento se harán en memoria (en el paso handleSnapshot).
        // *********

        // Construir la consulta de Firestore
        if (filters.length > 0) {
            q = query(q, ...filters);
        }

        return q;
    }

    // Función que maneja los datos obtenidos de Firestore y aplica filtros/orden en memoria
    function handleSnapshot(snapshot) {
        let products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        // 1. Filtrado en Memoria (Precio)
        const minPrice = parseFloat(document.getElementById('min-price').value) || 0;
        const maxPriceEl = document.getElementById('max-price');
        const maxPrice = parseFloat(maxPriceEl.value);

        products = products.filter(p => {
            const priceMatch = p.precio >= minPrice && (!maxPrice || p.precio <= maxPrice);
            return priceMatch;
        });

        // 2. Ordenamiento en Memoria
        products.sort((a, b) => {
            switch (currentSort) {
                case 'price_asc':
                    return a.precio - b.precio;
                case 'price_desc':
                    return b.precio - a.precio;
                case 'name_asc':
                    return a.nombre.localeCompare(b.nombre);
                case 'default':
                default:
                    return 0; // Sin cambios de orden inicial
            }
        });

        // 3. Renderizar Filtros Dinámicos (Solo marcas por simplicidad)
        updateDynamicFilters(products);

        // 4. Renderizar Productos
        renderProducts(products);
    }

    // ----------------------------------------------------
    // 3. LÓGICA DE INTERFAZ Y EVENTOS
    // ----------------------------------------------------

    function updateDynamicFilters(products) {
        const brands = [...new Set(products.map(p => p.marca).filter(Boolean))].sort();
        brandFilterListEl.innerHTML = brands.map(brand => `
            <li>
                <label>
                    <input type="checkbox" name="marca" value="${brand}" 
                           ${(currentFilters.marca || []).includes(brand) ? 'checked' : ''}>
                    ${brand}
                </label>
            </li>
        `).join('');
        
        // Ocultar/Mostrar filtros específicos si es necesario (ejemplo con 'capacidad' y 'talla')
        const specificKey = currentCategory === 'tecnologia' ? 'capacidad' : (currentCategory === 'indumentaria' ? 'talla' : null);

        if (specificKey) {
            specificFilterGroupEl.style.display = 'block';
            specificFilterGroupEl.querySelector('h4').innerHTML = `<i class="fas fa-list-alt"></i> ${specificKey.charAt(0).toUpperCase() + specificKey.slice(1)}`;

            const specificValues = [...new Set(products.map(p => p[specificKey]).filter(Boolean))].sort();
            specificFilterListEl.innerHTML = specificValues.map(value => `
                <li>
                    <label>
                        <input type="checkbox" name="${specificKey}" value="${value}">
                        ${value}
                    </label>
                </li>
            `).join('');

        } else {
            specificFilterGroupEl.style.display = 'none';
        }
    }

    function setupEventListeners() {
        // Evento de Ordenamiento
        sortEl.addEventListener('change', () => {
            currentSort = sortEl.value;
            // Al cambiar el orden, volvemos a obtener datos (o re-procesamos el snapshot)
            startListening();
        });
        
        // Evento de Filtro de Marcas
        brandFilterListEl.addEventListener('change', (e) => {
            if (e.target.type === 'checkbox' && e.target.name === 'marca') {
                const selected = Array.from(brandFilterListEl.querySelectorAll('input:checked'))
                                    .map(input => input.value);
                currentFilters.marca = selected;
                startListening();
            }
        });

        // Evento de Aplicar Precio
        document.getElementById('apply-price-filter').addEventListener('click', () => {
            startListening();
        });

        // Evento de Limpiar Filtros
        document.querySelectorAll('.btn-clear-filter').forEach(button => {
            button.addEventListener('click', (e) => {
                const filterType = e.target.getAttribute('data-filter-type');
                if (filterType === 'marca') {
                    currentFilters.marca = [];
                    brandFilterListEl.querySelectorAll('input').forEach(input => input.checked = false);
                }
                // Limpiar otros filtros si existieran
                startListening();
            });
        });
    }

    // ----------------------------------------------------
    // 4. INICIO DE LA LÓGICA DE FIRESTORE
    // ----------------------------------------------------

    let unsubscribe = null;

    function startListening() {
        // Detener la escucha anterior si existe
        if (unsubscribe) {
            unsubscribe();
        }

        // Actualizar UI de título
        titleEl.textContent = getCategoryTitle(currentCategory);
        loadingMessageEl.style.display = 'block';
        loadingMessageEl.textContent = "Cargando productos...";
        productGridEl.innerHTML = ''; // Limpiar grid

        // Crear la consulta de Firestore
        const q = buildQuery();

        // Iniciar nueva escucha en tiempo real
        unsubscribe = onSnapshot(q, handleSnapshot, (error) => {
            console.error("Error al escuchar los productos:", error);
            loadingMessageEl.textContent = "Error: Conexión con Firebase no iniciada.";
        });
    }

    // ----------------------------------------------------
    // INICIALIZACIÓN
    // ----------------------------------------------------

    // Determinar la categoría inicial desde la URL
    currentCategory = urlParams.get('cat') || 'all';
    
    // Iniciar la escucha y configurar los eventos
    setupEventListeners();
    startListening();
}


// AÑADIMOS ESTO: Esperar a que el script de inicialización de Firebase dispare el evento
document.addEventListener('firebase-ready', initProductPage);
console.log("Script js/productos.js cargado. Esperando evento 'firebase-ready'...");
