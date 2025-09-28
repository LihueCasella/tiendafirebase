
// js/firebase-init.js (CORREGIDO)

// --- IMPORTANTE: Se usan las URLs completas de la CDN de Firebase ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, onSnapshot, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

function initializeFirebase() {
    // Reintentar hasta que la configuración y el DOM estén listos.
    if (typeof window.__firebase_config === 'undefined' || !document.body) {
        setTimeout(initializeFirebase, 50);
        return;
    }

    try {
        // 1. Inicializar Firebase con la configuración global
        const firebaseConfig = JSON.parse(window.__firebase_config);
        const app = initializeApp(firebaseConfig);

        // 2. Obtener los servicios necesarios
        const db = getFirestore(app);
        const auth = getAuth(app);

        // 3. Exponer los objetos y funciones de Firebase en `window` para que otros scripts los puedan usar
        window.db = db;
        window.auth = auth;
        window.doc = doc;
        window.getDoc = getDoc;
        window.collection = collection;
        window.query = query;
        window.where = where;
        window.onSnapshot = onSnapshot;
        window.runTransaction = runTransaction;

        // 4. Autenticación anónima para los visitantes
        signInAnonymously(auth).catch(e => console.error("Error de autenticación anónima:", e));
        
        onAuthStateChanged(auth, user => {
            const authStatus = document.getElementById('auth-status');
            if (authStatus) {
                authStatus.textContent = user ? 'Conectado' : 'Ingresar';
            }
        });

        // 5. Disparar un evento para notificar al resto de la aplicación que Firebase está listo
        console.log("Firebase está listo. Despachando evento 'firebase-ready'.");
        document.dispatchEvent(new CustomEvent('firebase-ready'));

    } catch (e) {
        console.error("Error CRÍTICO al inicializar Firebase:", e);
        // Mostrar un error visible al usuario si todo falla
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = "Error CRÍTICO: No se pudo conectar a la base de datos.";
            loadingMessage.style.color = 'red';
        }
    }
}

// Iniciar el proceso de inicialización
initializeFirebase();
