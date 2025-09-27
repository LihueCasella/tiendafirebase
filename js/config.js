
// Archivo de configuración de Firebase
// ¡¡¡ATENCIÓN!!!
// REEMPLAZA los valores de marcador de posición con tus propias credenciales de Firebase.
// NO compartas este archivo públicamente si contiene claves sensibles.

const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_AUTH_DOMAIN",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_STORAGE_BUCKET",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Hacemos la configuración accesible globalmente
window.__firebase_config = JSON.stringify(firebaseConfig);
