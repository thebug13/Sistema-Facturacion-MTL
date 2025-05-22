// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAQAK-nOZir3MFnJBXPWH1oo7oCTbsgL8k",
    authDomain: "facturasmtl-64b09.firebaseapp.com",
    databaseURL: "https://facturasmtl-64b09-default-rtdb.firebaseio.com",
    projectId: "facturasmtl-64b09",
    storageBucket: "facturasmtl-64b09.firebasestorage.app",
    messagingSenderId: "716795758798",
    appId: "1:716795758798:web:d75998b549b5636cca689f",
    measurementId: "G-BPS33779DD"
};

// Initialize Firebase
try {
    firebase.initializeApp(firebaseConfig);
    console.log('Firebase inicializado correctamente');
} catch (error) {
    console.error('Error al inicializar Firebase:', error);
}

const database = firebase.database();

// Google Drive API configuration
const CLIENT_ID = '53135705535-q749sqbj3qigvgcebcoh3slvjn1b5e17.apps.googleusercontent.com';
const API_KEY = 'AIzaSyD9Pt20HcuIDRzXIayNlD9wPEl5PTvH6n4';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

// Initialize Google Drive API
function initGoogleDrive() {
    gapi.load('client:auth2', () => {
        gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        }).then(() => {
            console.log('Google Drive API inicializada correctamente');
            // Listen for sign-in state changes
            gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
            // Handle the initial sign-in state
            updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        }).catch(error => {
            console.error('Error al inicializar Google Drive API:', error);
            alert('Error al inicializar Google Drive. Por favor, recarga la página.');
        });
    });
}

// Update UI based on sign-in status
function updateSigninStatus(isSignedIn) {
    const loginButton = document.getElementById('loginButton');
    if (isSignedIn) {
        console.log('Usuario autenticado');
        loginButton.style.display = 'none';
    } else {
        console.log('Usuario no autenticado');
        loginButton.style.display = 'block';
    }
}

// Función para iniciar sesión
function handleAuthClick() {
    gapi.auth2.getAuthInstance().signIn().then(() => {
        console.log('Usuario autenticado correctamente');
    }).catch(error => {
        console.error('Error al autenticar:', error);
        alert('Error al iniciar sesión con Google Drive: ' + error.message);
    });
}

// Function to send WhatsApp
async function sendWhatsApp(phoneNumber, pdfBlob) {
    // Check if Google Drive API client is loaded
    if (!window.gapi || !window.gapi.client) {
        console.error('Google Drive API client is not loaded.');
        alert('La API de Google Drive aún no está lista. Por favor, espera un momento e inténtalo de nuevo.');
        return;
    }

    try {
        // Crear un nombre único para el PDF
        const fileName = `factura-${new Date().getTime()}.pdf`;

        // Metadata para el archivo en Google Drive
        const fileMetadata = {
            name: fileName,
            mimeType: 'application/pdf',
        };

        // Crear el formulario para la subida
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
        form.append('file', pdfBlob);

        // Subir el archivo a Google Drive
        const uploadResponse = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
            method: 'POST',
            headers: new Headers({'Authorization': 'Bearer ' + gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}),
            body: form,
        });

        const uploadedFile = await uploadResponse.json();
        console.log('Archivo subido a Google Drive:', uploadedFile);

        // Obtener el enlace para compartir (hacerlo público)
        if (uploadedFile && uploadedFile.id) {
            await gapi.client.drive.permissions.create({
                fileId: uploadedFile.id,
                resource: {
                    role: 'reader',
                    type: 'anyone',
                },
            });

            // Obtener la información del archivo para obtener el enlace web
            const fileInfo = await gapi.client.drive.files.get({
                fileId: uploadedFile.id,
                fields: 'webViewLink',
            });

            const downloadURL = fileInfo.result.webViewLink;
            console.log('Enlace para compartir:', downloadURL);

            // Crear el mensaje para WhatsApp con la URL de descarga
            const message = `Adjunto la factura de su servicio. Por favor, haga clic en el enlace para descargarla: ${downloadURL}`;

            // Abrir WhatsApp con el mensaje
            const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');

        } else {
            throw new Error('No se pudo obtener el ID del archivo subido.');
        }

    } catch (error) {
        console.error('Error al enviar por WhatsApp (Google Drive):', error);
        alert('Error al enviar por WhatsApp: ' + error.message);
    }
}

// Wrap DOM manipulation and event listeners in DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando aplicación...');

    // DOM Elements
    const invoiceForm = document.getElementById('invoiceForm');
    const partsList = document.getElementById('partsList');
    const addPartBtn = document.getElementById('addPart');
    const logoImg = document.getElementById('logo');

    if (!invoiceForm) {
        console.error('No se encontró el formulario');
        return;
    }

    if (!partsList) {
        console.error('No se encontró la lista de partes');
        return;
    }

    if (!addPartBtn) {
        console.error('No se encontró el botón de agregar parte');
        return;
    }

    console.log('Elementos DOM encontrados correctamente');

    // Tab switching for index.html (Create and Admin tabs)
    document.querySelectorAll('.tabs .tab-btn').forEach(button => {
        // Only apply tab switching to buttons with data-tab attribute
        if (button.dataset.tab) {
            button.addEventListener('click', () => {
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                button.classList.add('active');
                document.getElementById(`${button.dataset.tab}-tab`).classList.add('active');
                
                // Load admin records when admin tab is active
                if (button.dataset.tab === 'admin') {
                    loadAllRecords();
                }
            });
        }
    });

    // Check URL hash to activate admin tab on load if linked from view_invoice.html
    if (window.location.hash === '#admin-tab-link') {
        document.querySelector('[data-tab="admin"]').click();
    }

    // Add new part row
    addPartBtn.addEventListener('click', () => {
        const partItem = document.querySelector('.part-item').cloneNode(true);
        partItem.querySelectorAll('input').forEach(input => input.value = '');
        partItem.querySelector('.part-subtotal').textContent = '0.00';
        partsList.appendChild(partItem);
        setupPartItemListeners(partItem);
    });

    // Setup part item listeners
    function setupPartItemListeners(partItem) {
        const quantityInput = partItem.querySelector('.part-quantity');
        const priceInput = partItem.querySelector('.part-price');
        const subtotalSpan = partItem.querySelector('.part-subtotal');
        const removeBtn = partItem.querySelector('.remove-part');

        const calculateSubtotal = () => {
            const quantity = parseFloat(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            subtotalSpan.textContent = (quantity * price).toFixed(2);
        };

        quantityInput.addEventListener('input', calculateSubtotal);
        priceInput.addEventListener('input', calculateSubtotal);

        removeBtn.addEventListener('click', () => {
            if (document.querySelectorAll('.part-item').length > 1) {
                partItem.remove();
            }
        });
    }

    // Setup initial part item
    setupPartItemListeners(document.querySelector('.part-item'));

    // Función para formatear la placa
    function formatPlate(plate) {
        // Eliminar cualquier carácter que no sea letra o número
        plate = plate.replace(/[^A-Za-z0-9]/g, '');
        
        // Convertir a mayúsculas
        plate = plate.toUpperCase();
        
        // Si la longitud es mayor a 3, insertar el guión
        if (plate.length > 3) {
            plate = plate.slice(0, 3) + '-' + plate.slice(3);
        }
        
        return plate;
    }

    // Modificar el evento de input de la placa
    document.getElementById('plate').addEventListener('input', function(e) {
        let value = e.target.value;
        value = formatPlate(value);
        e.target.value = value;
    });

    // Create dialog elements
    const dialogOverlay = document.createElement('div');
    dialogOverlay.className = 'dialog-overlay';
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'confirm-dialog';
    confirmDialog.innerHTML = `
        <h3>Confirmar eliminación</h3>
        <p>¿Estás seguro de que deseas eliminar esta factura?</p>
        <div class="dialog-buttons">
            <button class="btn" id="cancelDelete">Cancelar</button>
            <button class="btn btn-delete" id="confirmDelete">Eliminar</button>
        </div>
    `;

    // Create WhatsApp dialog
    const whatsappDialog = document.createElement('div');
    whatsappDialog.className = 'confirm-dialog';
    whatsappDialog.innerHTML = `
        <h3>Enviar por WhatsApp</h3>
        <p>¿Deseas enviar el PDF de la factura por WhatsApp al cliente?</p>
        <div class="dialog-buttons">
            <button class="btn" id="cancelWhatsApp">No</button>
            <button class="btn btn-primary" id="confirmWhatsApp">Sí, enviar</button>
        </div>
    `;

    document.body.appendChild(dialogOverlay);
    document.body.appendChild(confirmDialog);
    document.body.appendChild(whatsappDialog);

    // Function to show WhatsApp dialog
    function showWhatsAppDialog(phoneNumber, pdfBlob) {
        dialogOverlay.classList.add('active');
        whatsappDialog.classList.add('active');

        const cancelBtn = document.getElementById('cancelWhatsApp');
        const confirmBtn = document.getElementById('confirmWhatsApp');

        const closeDialog = () => {
            dialogOverlay.classList.remove('active');
            whatsappDialog.classList.remove('active');
        };

        cancelBtn.onclick = closeDialog;
        confirmBtn.onclick = () => {
            closeDialog();
            sendWhatsApp(phoneNumber, pdfBlob);
        };
    }

    // Modificar el manejo del formulario
    if(invoiceForm) {
        console.log('Formulario encontrado, agregando event listener');
        invoiceForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Formulario enviado');

            const plate = document.getElementById('plate').value;
            const brand = document.getElementById('brand').value;
            const model = document.getElementById('model').value;
            const clientPhone = document.getElementById('clientPhone').value;
            const date = document.getElementById('date').value;
            const parts = [];

            console.log('Datos del formulario:', { plate, brand, model, clientPhone, date });

            document.querySelectorAll('.part-item').forEach(item => {
                const partName = item.querySelector('.part-name').value;
                const quantity = parseFloat(item.querySelector('.part-quantity').value) || 0;
                const price = parseFloat(item.querySelector('.part-price').value) || 0;
                const subtotal = parseFloat(item.querySelector('.part-subtotal').textContent) || 0;
                
                console.log('Parte encontrada:', { partName, quantity, price, subtotal });
                
                parts.push({
                    name: partName,
                    quantity: quantity,
                    price: price,
                    subtotal: subtotal
                });
            });

            const invoice = {
                plate,
                brand,
                model,
                clientPhone,
                date,
                parts,
                total: parts.reduce((sum, part) => sum + part.subtotal, 0),
                createdAt: new Date().toISOString()
            };

            console.log('Objeto factura preparado:', invoice);

            try {
                const invoiceId = new Date().getTime().toString();
                console.log('Intentando guardar en Firebase...');
                
                await database.ref(`invoices/${plate}/${invoiceId}`).set(invoice)
                    .then(async () => {
                        console.log('Factura guardada exitosamente en Firebase');
                        
                        // Generar el PDF
                        const { jsPDF } = window.jspdf;
                        const doc = new jsPDF();

                        // Add header
                        doc.setFontSize(20);
                        doc.text('Factura de Repuestos', 105, 20, { align: 'center' });
                        
                        doc.setFontSize(12);
                        doc.text(`Fecha: ${new Date(invoice.date).toLocaleDateString()}`, 10, 40);
                        doc.text(`Placa: ${invoice.plate}`, 10, 50);
                        doc.text(`Marca: ${invoice.brand || 'N/A'}`, 10, 60);
                        doc.text(`Modelo: ${invoice.model || 'N/A'}`, 10, 70);

                        // Add table
                        doc.autoTable({
                            startY: 80,
                            head: [['Repuesto', 'Cantidad', 'Precio Unitario', 'Subtotal']],
                            body: invoice.parts.map(part => [
                                part.name,
                                part.quantity,
                                `$${part.price.toFixed(2)}`,
                                `$${part.subtotal.toFixed(2)}`
                            ]),
                            foot: [['', '', 'Total', `$${invoice.total.toFixed(2)}`]]
                        });

                        // Convertir el PDF a Blob
                        const pdfBlob = doc.output('blob');

                        // Mostrar el diálogo de WhatsApp si hay un número de teléfono
                        if (clientPhone) {
                            showWhatsAppDialog(clientPhone, pdfBlob);
                        } else {
                            alert('Factura guardada exitosamente');
                        }

                        invoiceForm.reset();
                        document.querySelectorAll('.part-item').forEach((item, index) => {
                            if (index > 0) item.remove();
                        });
                    })
                    .catch((error) => {
                        console.error('Error al guardar en Firebase:', error);
                        alert('Error al guardar la factura: ' + error.message);
                    });
            } catch (error) {
                console.error('Error general:', error);
                alert('Error al guardar la factura: ' + error.message);
            }
        });
    } else {
        console.error('No se encontró el formulario con id "invoiceForm"');
    }

    // Admin functionality
    const adminResults = document.getElementById('adminResults');

    // Function to load all records
    async function loadAllRecords() {
        try {
            const snapshot = await database.ref('invoices').once('value');
            const data = snapshot.val();
            if (data) {
                displayAdminResults(data);
            } else {
                adminResults.innerHTML = '<p>No hay registros en la base de datos.</p>';
            }
        } catch (error) {
            alert('Error al cargar los registros: ' + error.message);
        }
    }

    // Display admin results
    function displayAdminResults(data) {
        const plates = Object.keys(data);
        let html = '<table class="admin-table">';
        html += `
            <thead>
                <tr>
                    <th>Placa</th>
                    <th>Fecha</th>
                    <th>Total</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
        `;

        plates.forEach(plate => {
            const invoices = Object.entries(data[plate]);
            invoices.forEach(([invoiceId, invoice]) => {
                html += `
                    <tr>
                        <td>${plate}</td>
                        <td>${new Date(invoice.date).toLocaleDateString()}</td>
                        <td>$${invoice.total.toFixed(2)}</td>
                        <td class="admin-actions">
                            <button class="btn btn-view" onclick="viewInvoice('${plate}', '${invoiceId}')">Ver</button>
                            <button class="btn btn-delete" onclick="confirmDelete('${plate}', '${invoiceId}')">Eliminar</button>
                        </td>
                    </tr>
                `;
            });
        });

        html += '</tbody></table>';
        adminResults.innerHTML = html;
    }

    // View invoice in admin panel
    window.viewInvoice = function(plate, invoiceId) {
        // Redirect to view_invoice.html with plate as query parameter
        window.location.href = `view_invoice.html?plate=${plate}`;
    };

    // Confirm delete dialog
    window.confirmDelete = function(plate, invoiceId) {
        dialogOverlay.classList.add('active');
        confirmDialog.classList.add('active');

        const cancelBtn = document.getElementById('cancelDelete');
        const confirmBtn = document.getElementById('confirmDelete');

        const closeDialog = () => {
            dialogOverlay.classList.remove('active');
            confirmDialog.classList.remove('active');
        };

        cancelBtn.onclick = closeDialog;
        confirmBtn.onclick = async () => {
            try {
                await database.ref(`invoices/${plate}/${invoiceId}`).remove();
                closeDialog();
                // Recargar todos los registros
                loadAllRecords();
                alert('Factura eliminada exitosamente');
            } catch (error) {
                alert('Error al eliminar la factura: ' + error.message);
            }
        };
    };
}); 