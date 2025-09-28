// js/firebase-init.js (CORREGIDO)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, getDocs, limit, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

function initializeFirebase() {
    if (typeof window.firebaseConfig === 'undefined') {
        console.error("La configuración de Firebase (firebaseConfig) no se encontró. Asegúrate de que js/config.js se cargue primero.");
        return;
    }

    try {
        const app = initializeApp(window.firebaseConfig);
        const db = getFirestore(app);
        const auth = getAuth(app);

        // Exponer los objetos y funciones de Firebase en `window`
        window.db = db;
        window.auth = auth;
        window.doc = doc;
        window.getDoc = getDoc;
        window.collection = collection;
        window.query = query;
        window.where = where;
        window.getDocs = getDocs; // <-- FALTABA ESTO
        window.limit = limit;     // <-- Y FALTABA ESTO
        window.runTransaction = runTransaction;

        signInAnonymously(auth).catch(e => console.error("Error de autenticación anónima:", e));
        
onAuthStateChanged(auth, user => {
            const authStatus = document.getElementById('auth-status');
            if (authStatus) {
                 if (user) {
                    authStatus.textContent = `Conectado`;
                } else {
                    authStatus.textContent = 'Ingresar';
                }
            }
        });

        console.log("Firebase está listo. Despachando evento 'firebase-ready'.");
        document.dispatchEvent(new CustomEvent('firebase-ready'));

    } catch (e) {
        console.error("Error CRÍTICO al inicializar Firebase:", e);
    }
}

initializeFirebase();
