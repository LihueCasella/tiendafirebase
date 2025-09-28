// js/init_data.js (Simplificado: Sin inicialización de productos)

// La importación de startFeaturedProducts ya no es necesaria.
// import { startFeaturedProducts } from './app.js';

// El evento de 'firebase-ready' se sigue escuchando por si se necesita en el futuro,
// pero la función que se ejecuta ahora está vacía.
document.addEventListener('firebase-ready', () => {

    console.log("Evento 'firebase-ready' recibido, pero la inicialización de productos destacados ha sido desactivada.");

    // La función main() que poblaba la base de datos ha sido eliminada.
    // La llamada a startFeaturedProducts() ha sido eliminada.

});
