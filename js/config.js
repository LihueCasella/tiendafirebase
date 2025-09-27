// Archivo de configuración de Firebase
// ¡¡¡ATENCIÓN!!!
// REEMPLAZA los valores de marcador de posición con tus propias credenciales de Firebase.
// NO compartas este archivo públicamente si contiene claves sensibles.

const firebaseConfig = {
  apiKey: "PEGA_TU_API_KEY_AQUI",
  authDomain: "ecommerce-50cb5.firebaseapp.com",
  projectId: "ecommerce-50cb5",
  storageBucket: "PEGA_TU_STORAGE_BUCKET_AQUI",
  messagingSenderId: "PEGA_TU_MESSAGING_SENDER_ID_AQUI",
  appId: "PEGA_TU_APP_ID_AQUI"
};

// Hacemos la configuración accesible globalmente
window.__firebase_config = JSON.stringify(firebaseConfig);
