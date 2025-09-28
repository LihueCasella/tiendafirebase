// js/firebase-init.js (Solución a la condición de carrera)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, limit, runTransaction, onSnapshot } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

function initializeFirebase() {
    if (typeof window.__firebase_config === 'undefined') {
        console.error("La configuración de Firebase no se encontró.");
        return;
    }

    try {
        const app = initializeApp(window.__firebase_config);
        // Exponer todas las funciones de Firebase en `window` para que sean globales
        window.db = getFirestore(app);
        window.auth = getAuth(app);
        window.doc = doc;
        window.getDoc = getDoc;
        window.collection = collection;
        window.query = query;
        window.where = where;
        window.getDocs = getDocs;
        window.limit = limit;
        window.runTransaction = runTransaction;
        window.onSnapshot = onSnapshot;

        signInAnonymously(window.auth).catch(e => console.error("Error de autenticación anónima:", e));
        
onAuthStateChanged(window.auth, user => {
            const authStatus = document.getElementById('auth-status');
            if (authStatus) {
                 if (user) {
                    authStatus.textContent = `Conectado`;
                } else {
                    authStatus.textContent = 'Ingresar';
                }
            }
        });

        // 1. Establecemos la bandera para indicar que Firebase está listo.
        window.firebaseIsReady = true;
        // 2. Despachamos el evento para los scripts que ya están escuchando.
        console.log("Firebase está listo. Despachando evento 'firebase-ready'.");
        document.dispatchEvent(new CustomEvent('firebase-ready'));

    } catch (e) {
        console.error("Error CRÍTICO al inicializar Firebase:", e);
    }
}

initializeFirebase();
