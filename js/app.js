// js/app.js (Simplificado: Sin lógica de productos destacados)

// La función se mantiene por si se usa en otros sitios, pero ya no hace nada.
export function startFeaturedProducts() {
    // Esta función ha sido vaciada intencionalmente.
}

// La lógica del carrito se puede mantener por si es necesaria en otras páginas.

// --- Lógica del Carrito (se mantiene por si acaso) ---
const getProductById = async (productId) => {
    if (!window.db) return null; // Guard clause por si firebase no carga
    const docRef = doc(db, `/artifacts/${window.__app_id || 'default'}/public/data/productos`, productId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
};
const getCart = () => JSON.parse(localStorage.getItem('cart')) || [];
const saveCart = (cart) => { localStorage.setItem('cart', JSON.stringify(cart)); updateCartCount(); };
const addToCart = async (productId) => {
    const cart = getCart();
    const productExists = cart.find(item => item.id === productId);
    if (productExists) {
        productExists.quantity++;
    } else {
        const productData = await getProductById(productId);
        if (productData) cart.push({ id: productId, quantity: 1, name: productData.nombre, price: productData.precio });
    }
    saveCart(cart);
    alert('Producto añadido/actualizado.');
};
const updateCartCount = () => {
    const cartIcon = document.querySelector('.cart-icon');
    if (!cartIcon) return;
    const totalItems = getCart().reduce((sum, item) => sum + item.quantity, 0);
    cartIcon.textContent = `🛒 Carrito (${totalItems})`;
};

// Actualizamos el carrito al cargar la página por si hay algo guardado
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
});
