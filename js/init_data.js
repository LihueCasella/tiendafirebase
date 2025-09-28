// js/init_data.js (Versión final con DOMContentLoaded)

import { db, collection, getDocs, addDoc } from './firebase-init.js';
import { startFeaturedProducts } from './app.js';

// Envolvemos toda la lógica en un listener que espera a que el DOM esté completamente cargado.
// Esta es la solución definitiva para evitar condiciones de carrera.
document.addEventListener('DOMContentLoaded', () => {

    console.log("El DOM se ha cargado completamente. Iniciando la aplicación...");

    const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const PRODUCTS_COLLECTION_PATH = `/artifacts/${APP_ID}/public/data/productos`;
    const productsCollectionRef = collection(db, PRODUCTS_COLLECTION_PATH);

    const initialProducts = [
        { nombre: "Smartphone Nova 10", categoria: "tecnologia", precio: 599.99, image: "https://placehold.co/300x300/1e40af/ffffff?text=Smartphone" },
        { nombre: "Auriculares Bluetooth P3", categoria: "tecnologia", precio: 79.50, image: "https://placehold.co/300x300/10b981/ffffff?text=Auriculares" },
        { nombre: "Monitor Curvo 27' Pro", categoria: "tecnologia", precio: 349.00, image: "https://placehold.co/300x300/f59e0b/ffffff?text=Monitor" },
        { nombre: "Jeans Slim Fit Clásicos", categoria: "indumentaria", precio: 45.99, image: "https://placehold.co/300x300/ef4444/ffffff?text=Jeans" },
        { nombre: "Chaqueta de Invierno Alpina", categoria: "indumentaria", precio: 129.99, image: "https://placehold.co/300x300/a855f7/ffffff?text=Chaqueta" },
        { nombre: "Camiseta Deportiva DRI-FIT", categoria: "indumentaria", precio: 25.00, image: "https://placehold.co/300x300/06b6d4/ffffff?text=Camiseta" },
        { nombre: "Cafetera Expresso Automática", categoria: "hogar", precio: 199.90, image: "https://placehold.co/300x300/fbbf24/333?text=Cafetera" },
        { nombre: "Juego de Sábanas de Lino", categoria: "hogar", precio: 85.00, image: "https://placehold.co/300x300/16a34a/ffffff?text=Sabanas" },
        { nombre: "Aspiradora Robótica Smart", categoria: "hogar", precio: 250.50, image: "https://placehold.co/300x300/4f46e5/ffffff?text=Aspiradora" },
        { nombre: "Lámpara de Escritorio LED", categoria: "hogar", precio: 40.00, image: "https://placehold.co/300x300/f97316/ffffff?text=Lampara" }
    ];

    async function main() {
        try {
            const snapshot = await getDocs(productsCollectionRef);
            if (snapshot.size === 0) {
                console.log(`Iniciando la inserción de ${initialProducts.length} productos...`);
                for (const product of initialProducts) {
                    await addDoc(productsCollectionRef, product);
                }
                console.log("¡Productos de prueba insertados con éxito!");
            } else {
                console.log(`Ya existen ${snapshot.size} productos. Inicialización omitida.`);
            }
            
            console.log("Datos listos. Llamando a startFeaturedProducts...");
            startFeaturedProducts();

        } catch (error) {
            console.error("Error CRÍTICO en el script de inicialización (main):", error);
            // Aunque haya un error, intentamos mostrar los productos que ya existan.
            startFeaturedProducts();
        }
    }

    // Ejecutar la función principal.
    main();
});
