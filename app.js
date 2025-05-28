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
const auth = firebase.auth();

// Check authentication state immediately
console.log('Checking auth state initially...');
auth.onAuthStateChanged((user) => {
    if (!user) {
        console.log('onAuthStateChanged: No user signed in, redirecting to login.');
        // Avoid infinite redirects if already on login page
        if (window.location.pathname !== '/login.html' && !window.location.pathname.endsWith('/login.html')) {
             window.location.href = 'login.html';
        } else {
            console.log('Already on login page.');
        }
        return;
    }
    console.log('onAuthStateChanged: User signed in:', user.uid);

});

// Wrap DOM manipulation and event listeners in DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded fired, initializing application...');

    // Check authentication state again - This listener will fire again after DOM is ready if user is signed in
    auth.onAuthStateChanged((user) => {
        if (!user) {
             console.log('DOMContentLoaded + onAuthStateChanged: No user signed in. Logic inside this block will not run.');
             // Redirection is handled by the initial onAuthStateChanged listener
             return;
        }

        // User is signed in, proceed with app initialization that requires DOM
        console.log('DOMContentLoaded + onAuthStateChanged: User signed in, proceeding with DOM-dependent initialization.');

        // DOM Elements
        const invoiceForm = document.getElementById('invoiceForm');
        const partsList = document.getElementById('partsList');
        const addPartBtn = document.getElementById('addPart');
        const logoImg = document.getElementById('logo');
        const logoutBtn = document.getElementById('logoutBtn');
        const adminResults = document.getElementById('adminResults');
        const adminTabBtn = document.querySelector('[data-tab="admin"]');

        if (!invoiceForm) {
            console.error('No se encontró el formulario');
        }

        if (!partsList) {
            console.error('No se encontró la lista de partes');
        }

        if (!addPartBtn) {
            console.error('No se encontró el botón de agregar parte');
        }

        if (!logoutBtn) {
            console.error('No se encontró el botón de cerrar sesión');
        }

        console.log('Elementos DOM encontrados para usuario autenticado.');

        // Add logout button listener
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                auth.signOut()
                    .then(() => {
                        console.log('User signed out.');
                        window.location.href = 'login.html';
                    })
                    .catch((error) => {
                        console.error('Error signing out:', error);
                        alert('Error al cerrar sesión: ' + error.message);
                    });
            });
        }

        // Add admin tab button listener
        if (adminTabBtn) {
            adminTabBtn.addEventListener('click', () => {
                // Switch to admin tab
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                
                adminTabBtn.classList.add('active');
                const adminTab = document.getElementById('admin-tab');
                if (adminTab) {
                    adminTab.classList.add('active');
                    // Load admin records
                    loadAllRecords();
                }
            });
        }

        // Tab switching for index.html (Create and Admin tabs)
        document.querySelectorAll('.tabs .tab-btn').forEach(button => {
            // Only apply tab switching to buttons with data-tab attribute
            if (button.dataset.tab) {
                button.addEventListener('click', () => {
                    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
                    
                    button.classList.add('active');
                    const targetTabId = `${button.dataset.tab}-tab`;
                    const targetTabElement = document.getElementById(targetTabId);
                    if (targetTabElement) {
                        targetTabElement.classList.add('active');
                    } else {
                         console.error(`Target tab element not found: ${targetTabId}`);
                    }

                    // Load admin records when admin tab is active
                    if (button.dataset.tab === 'admin') {
                        loadAllRecords();
                    }
                });
            }
        });

        // Check URL hash to activate admin tab on load if linked from view_invoice.html
        if (window.location.hash === '#admin-tab-link') {
            // Use a small delay to ensure tabs listeners are attached
             setTimeout(() => {
                const adminTabBtn = document.querySelector('[data-tab="admin"]');
                if (adminTabBtn) {
                     adminTabBtn.click();
                } else {
                     console.error('Admin tab button not found for hash link.');
                }
            }, 50);
        }

        // Add new part row (listener)
        if (addPartBtn && partsList) {
             addPartBtn.addEventListener('click', () => {
                const partItem = document.querySelector('.part-item').cloneNode(true);
                partItem.querySelectorAll('input').forEach(input => input.value = '');
                partsList.appendChild(partItem);
                setupPartItemListeners(partItem);
            });
        }

        // Setup part item listeners (function definition - keep outside DOMContentLoaded or call from here)
        // Moved definition outside DOMContentLoaded for better scope/reusability

        // Setup initial part item listeners (call inside if user block)
         setupPartItemListeners(document.querySelector('.part-item'));

        // Función para formatear la placa (keep definition outside)
        // Modificar el evento de input de la placa (listener - move inside if user block)
        const plateInput = document.getElementById('plate');
        if (plateInput) {
             plateInput.addEventListener('input', function(e) {
                let value = e.target.value;
                value = formatPlate(value);
                e.target.value = value;
            });
        }

        // Modificar el manejo del formulario (listener - move inside if user block)
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
                    
                    console.log('Parte encontrada:', { partName, quantity, price });
                    
                    parts.push({
                        name: partName,
                        quantity: quantity,
                        price: price,
                        subtotal: quantity * price
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
                        .then(() => {
                            console.log('Factura guardada exitosamente en Firebase');
                            
                            alert('Factura guardada exitosamente');

                            invoiceForm.reset();
                            document.querySelectorAll('.part-item').forEach((item, index) => {
                                if (index > 0) item.remove();
                            });
                            setupPartItemListeners(document.querySelector('.part-item'));

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

        // Admin functionality (keep function definitions outside)
        // const adminResults = document.getElementById('adminResults'); // Moved up
        // Function to load all records (keep definition outside)
        // Display admin results (keep definition outside)

        // View invoice in admin panel (keep definition outside)

        // Confirm delete dialog (keep definition outside)

        // Function to delete invoice (keep definition outside)

    });
});

// Function definitions (moved outside DOMContentLoaded or kept here if they were already)

// Setup part item listeners
function setupPartItemListeners(partItem) {
    const quantityInput = partItem.querySelector('.part-quantity');
    const priceInput = partItem.querySelector('.part-price');
    const subtotalSpan = partItem.querySelector('.part-subtotal');
    const removeBtn = partItem.querySelector('.remove-part');
    const partNameInput = partItem.querySelector('.part-name');

    // Convert part name to uppercase on input
    partNameInput.addEventListener('input', function() {
        this.value = this.value.toUpperCase();
    });

    const calculateSubtotal = () => {
        const quantity = parseFloat(quantityInput.value) || 0;
        const price = parseFloat(priceInput.value) || 0;
        subtotalSpan.textContent = `COP$${(quantity * price).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    };

    quantityInput.addEventListener('input', calculateSubtotal);
    priceInput.addEventListener('input', calculateSubtotal);

    removeBtn.addEventListener('click', () => {
        if (document.querySelectorAll('.part-item').length > 1) {
            partItem.remove();
            // Recalculate total if displayed (not currently in app.js create tab)
        }
    });
}

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

// Admin functionality function definitions (kept outside DOMContentLoaded)

// Function to load all records
async function loadAllRecords() {
    try {
        // Ensure adminResults element is available (selected inside the if user block)
        const adminResults = document.getElementById('adminResults');
        if (!adminResults) {
            console.error('Admin results div not found!');
            return;
        }
        const snapshot = await database.ref('invoices').once('value');
        const data = snapshot.val();
        if (data) {
            displayAdminResults(data);
        } else {
            adminResults.innerHTML = '<p>No hay registros en la base de datos.</p>';
        }
    } catch (error) {
        alert('Error al cargar los registros: ' + error.message);
        console.error('Error loading admin records:', error);
    }
}

// Display admin results
function displayAdminResults(data) {
    const adminResults = document.getElementById('adminResults');
    if (!adminResults) {
        console.error('Admin results div not found in display function!');
        return;
    }
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
                    <td>COP$${invoice.total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</td>
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

// Confirm delete dialog (using browser confirm now)
window.confirmDelete = function(plate, invoiceId) {
     if (confirm('¿Estás seguro de que deseas eliminar esta factura?')) {
        deleteInvoice(plate, invoiceId);
    }
};

// Function to delete invoice
async function deleteInvoice(plate, invoiceId) {
     try {
            await database.ref(`invoices/${plate}/${invoiceId}`).remove();
            // Recargar todos los registros
            loadAllRecords();
            alert('Factura eliminada exitosamente');
        } catch (error) {
            alert('Error al eliminar la factura: ' + error.message);
            console.error('Error deleting invoice:', error);
        }
} 