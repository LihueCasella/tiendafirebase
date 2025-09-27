
// js/firebase-init.js

// Importaciones de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth, signInAnonymously, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore, collection, query, where, onSnapshot, setLogLevel, addDoc, getDocs } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// Activar logs de Firebase para debugging
setLogLevel('Debug');

const authStatusEl = document.getElementById('auth-status');

// Función para leer la configuración de forma segura
function getFirebaseConfig() {
    try {
        // Leer la variable global de configuración
        const configString = typeof __firebase_config !== 'undefined' ? __firebase_config : '{}';
        
        console.debug("DEBUG: Valor crudo de __firebase_config:", configString);
        
        const config = JSON.parse(configString);
        
        // VALIDACIÓN: Simplemente verificar que el objeto JSON no esté vacío.
        if (Object.keys(config).length > 0 && config.apiKey !== "TU_API_KEY") {
            return config;
        } else {
             console.warn("La configuración de Firebase parece usar valores de marcador de posición. Reemplázalos en js/config.js");
        }
    } catch (e) {
        console.error("Error al parsear __firebase_config:", e);
    }
    return null;
}

const firebaseConfig = getFirebaseConfig();

if (firebaseConfig === null) {
    authStatusEl.textContent = "Error: Config Inválida.";
    console.error("Error de configuración: La configuración de Firebase no es válida o está ausente. La inicialización se detiene.");

    // Exponer 'db = null' para que el script de productos sepa que falló
    window.db = null;
    document.dispatchEvent(new Event('firebase-ready')); // Dispara el evento para que los otros scripts no se queden esperando
} else {
    // Inicializar Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    // Autenticación: Usar token provisto o iniciar sesión anónimamente
    async function authenticate() {
        try {
            const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

            if (initialAuthToken) {
                await signInWithCustomToken(auth, initialAuthToken);
                authStatusEl.textContent = "Conectado";
            } else {
                await signInAnonymously(auth);
                authStatusEl.textContent = "Anónimo";
            }
            console.log("Firebase Authentication exitosa.");
        } catch (error) {
            console.error("Error en la autenticación de Firebase:", error);
            authStatusEl.textContent = "Fallo de Auth";
        }
    }

    // Exponer los objetos de Firebase al alcance global (window)
    window.db = db;
    window.auth = auth;
    window.collection = collection;
    window.query = query;
    window.where = where;
    window.onSnapshot = onSnapshot;
    window.addDoc = addDoc;
    window.getDocs = getDocs;

    // Iniciar autenticación y luego disparar un evento para que el script de productos empiece
    authenticate().then(() => {
        document.dispatchEvent(new Event('firebase-ready'));
    });
}
