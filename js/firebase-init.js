// js/firebase-init.js (CORREGIDO Y RESTAURADO)

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, doc, getDoc, collection, query, where, onSnapshot, runTransaction } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

function initializeFirebase() {
    // Reintentar hasta que la configuración (como objeto) esté lista.
    if (typeof window.__firebase_config !== 'object' || !window.__firebase_config) {
        console.warn("El objeto de configuración de Firebase no está listo, reintentando...");
        setTimeout(initializeFirebase, 50);
        return;
    }

    try {
        // --- CORRECCIÓN CLAVE ---
        // Usamos el objeto de configuración directamente, SIN JSON.parse().
        const firebaseConfig = window.__firebase_config;
        const app = initializeApp(firebaseConfig);

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
        window.onSnapshot = onSnapshot;
        window.runTransaction = runTransaction;

        // Autenticación anónima
        signInAnonymously(auth).catch(e => console.error("Error de autenticación anónima:", e));
        onAuthStateChanged(auth, user => {
            const authStatus = document.getElementById('auth-status');
            if (authStatus) {
                authStatus.textContent = user ? 'Conectado' : 'Ingresar';
            }
        });

        // Disparar el evento para notificar que Firebase está listo
        console.log("Firebase está listo. Despachando evento 'firebase-ready'.");
        document.dispatchEvent(new CustomEvent('firebase-ready'));

    } catch (e) {
        console.error("Error CRÍTICO al inicializar Firebase:", e);
        const loadingMessage = document.getElementById('loading-message');
        if (loadingMessage) {
            loadingMessage.textContent = "Error CRÍTICO: No se pudo conectar a la base de datos.";
            loadingMessage.style.color = 'red';
        }
    }
}

initializeFirebase();
