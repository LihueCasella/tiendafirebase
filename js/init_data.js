// ----------------------------------------------------
// Módulo: Inicialización de Datos de Prueba para Firestore
// ----------------------------------------------------

document.addEventListener('firebase-ready', async () => {
    console.log("Firebase listo. Verificando y creando datos de prueba...");

    // Variables globales (expuestas desde productos.html)
    const { db, collection, addDoc, getDocs } = window;
    
    // Constantes de configuración
    const APP_ID = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const PRODUCTS_COLLECTION_PATH = `/artifacts/${APP_ID}/public/data/productos`;
    const productsCollectionRef = collection(db, PRODUCTS_COLLECTION_PATH);

    const initialProducts = [
        // Productos de Tecnología
        {
            nombre: "Smartphone Nova 10",
            categoria: "tecnologia",
            marca: "TechCore",
            precio: 599.99,
            capacidad: "128GB",
            descripcion: "El último modelo con cámara de 108MP.",
            image: "https://placehold.co/300x300/1e40af/ffffff?text=Smartphone"
        },
        {
            nombre: "Auriculares Bluetooth P3",
            categoria: "tecnologia",
            marca: "SoundMax",
            precio: 79.50,
            capacidad: "24h Batería",
            descripcion: "Cancelación de ruido activa.",
            image: "https://placehold.co/300x300/10b981/ffffff?text=Auriculares"
        },
        {
            nombre: "Monitor Curvo 27' Pro",
            categoria: "tecnologia",
            marca: "ViewMaster",
            precio: 349.00,
            capacidad: "4K",
            descripcion: "Diseñado para gaming y trabajo.",
            image: "https://placehold.co/300x300/f59e0b/ffffff?text=Monitor"
        },

        // Productos de Indumentaria
        {
            nombre: "Jeans Slim Fit Clásicos",
            categoria: "indumentaria",
            marca: "DenimX",
            precio: 45.99,
            talla: "L",
            descripcion: "Algodón orgánico, color azul oscuro.",
            image: "https://placehold.co/300x300/ef4444/ffffff?text=Jeans"
        },
        {
            nombre: "Chaqueta de Invierno Alpina",
            categoria: "indumentaria",
            marca: "Climber",
            precio: 129.99,
            talla: "XL",
            descripcion: "Impermeable y térmica para bajas temperaturas.",
            image: "https://placehold.co/300x300/a855f7/ffffff?text=Chaqueta"
        },
        {
            nombre: "Camiseta Deportiva DRI-FIT",
            categoria: "indumentaria",
            marca: "Athletica",
            precio: 25.00,
            talla: "M",
            descripcion: "Tela transpirable y ligera.",
            image: "https://placehold.co/300x300/06b6d4/ffffff?text=Camiseta"
        },

        // Productos para el Hogar
        {
            nombre: "Cafetera Expresso Automática",
            categoria: "hogar",
            marca: "HomePro",
            precio: 199.90,
            material: "Acero Inoxidable",
            descripcion: "Prepara café con solo tocar un botón.",
            image: "https://placehold.co/300x300/fbbf24/333?text=Cafetera"
        },
        {
            nombre: "Juego de Sábanas de Lino",
            categoria: "hogar",
            marca: "DreamSleep",
            precio: 85.00,
            material: "Lino",
            descripcion: "Máximo confort para el descanso.",
            image: "https://placehold.co/300x300/16a34a/ffffff?text=Sabanas"
        },
        {
            nombre: "Aspiradora Robótica Smart",
            categoria: "hogar",
            marca: "CleanBot",
            precio: 250.50,
            material: "Plástico ABS",
            descripcion: "Mapeo inteligente y control por app.",
            image: "https://placehold.co/300x300/4f46e5/ffffff?text=Aspiradora"
        },
        
        // Producto de categoría 'all' para probar el listado general
        {
            nombre: "Lámpara de Escritorio LED",
            categoria: "hogar",
            marca: "HomePro",
            precio: 40.00,
            material: "Aluminio",
            descripcion: "Luz ajustable con 3 modos de color.",
            image: "https://placehold.co/300x300/f97316/ffffff?text=Lampara"
        }
    ];

    try {
        // Simple verificación: si ya hay documentos, no insertamos duplicados
        const snapshot = await getDocs(productsCollectionRef);
        if (snapshot.size > 0) {
            console.log(`Ya existen ${snapshot.size} productos. Inicialización omitida.`);
            return;
        }

        console.log(`Iniciando la inserción de ${initialProducts.length} productos...`);
        
        for (const product of initialProducts) {
            await addDoc(productsCollectionRef, product);
        }

        console.log("¡Productos de prueba insertados con éxito en Firestore!");
        console.log(`Colección: ${PRODUCTS_COLLECTION_PATH}`);

    } catch (error) {
        console.error("Error al inicializar los datos:", error);
    }
});
