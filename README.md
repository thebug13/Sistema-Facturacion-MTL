# Sistema de Facturación para Taller de Motos

Este es un sistema web simple para gestionar facturas de repuestos de motos. Permite crear facturas, almacenarlas en una base de datos y generar PDFs.

## Características

- Creación de facturas con múltiples repuestos
- Cálculo automático de subtotales
- Almacenamiento en Firebase Realtime Database
- Búsqueda de facturas por placa de moto
- Generación de PDFs
- Diseño responsivo
- Soporte para logo del taller

## Requisitos

- Cuenta de Firebase (gratuita)
- Navegador web moderno
- Conexión a internet

## Configuración

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita Realtime Database en tu proyecto
3. Obtén la configuración de Firebase:
   - Ve a la configuración del proyecto
   - En la sección "Tus apps", selecciona la opción web
   - Copia el objeto de configuración

4. Abre el archivo `app.js` y reemplaza el objeto `firebaseConfig` con tu configuración:

```javascript
const firebaseConfig = {
    apiKey: "TU_API_KEY",
    authDomain: "TU_AUTH_DOMAIN",
    databaseURL: "TU_DATABASE_URL",
    projectId: "TU_PROJECT_ID",
    storageBucket: "TU_STORAGE_BUCKET",
    messagingSenderId: "TU_MESSAGING_SENDER_ID",
    appId: "TU_APP_ID"
};
```

5. Configura las reglas de seguridad de Firebase:

```json
{
  "rules": {
    "invoices": {
      ".read": true,
      ".write": true
    }
  }
}
```

## Uso

1. Abre `index.html` en tu navegador
2. Para crear una factura:
   - Ingresa la placa de la moto
   - Selecciona la fecha
   - Agrega los repuestos (nombre, cantidad, precio)
   - El subtotal se calcula automáticamente
   - Haz clic en "Guardar Factura"

3. Para ver una factura:
   - Cambia a la pestaña "Ver Factura"
   - Ingresa la placa de la moto
   - Haz clic en "Buscar"
   - Para descargar el PDF, haz clic en "Descargar PDF"

4. Para agregar el logo del taller:
   - Haz clic en "Subir Logo"
   - Selecciona una imagen
   - El logo aparecerá en las facturas y PDFs

## Despliegue

El sistema puede ser desplegado en cualquier hosting estático como GitHub Pages:

1. Crea un repositorio en GitHub
2. Sube los archivos del proyecto
3. Habilita GitHub Pages en la configuración del repositorio

## Notas

- Los datos se almacenan en Firebase Realtime Database
- No se requiere backend propio
- El sistema funciona completamente en el navegador
- Los PDFs se generan en el cliente usando jsPDF

## Soporte

Si encuentras algún problema o tienes sugerencias, por favor crea un issue en el repositorio. 