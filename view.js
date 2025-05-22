// Firebase configuration (Copy from app.js)
const firebaseConfig = {
    apiKey: "AIzaSyCAYR4gUJ2R4iHcFoktNyFwtNJ1Ppa1CdI",
    authDomain: "facturasmtl.firebaseapp.com",
    databaseURL: "https://facturasmtl-default-rtdb.firebaseio.com",
    projectId: "facturasmtl",
    storageBucket: "facturasmtl.firebasestorage.app",
    messagingSenderId: "201300465957",
    appId: "1:201300465957:web:9cdbf3321ae2f2490ae2cc",
    measurementId: "G-K7JQ43T5KM"
};

// Initialize Firebase (Copy from app.js)
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// DOM Elements for view_invoice.html
const searchBtn = document.getElementById('searchBtn');
const searchPlate = document.getElementById('searchPlate');
const invoiceView = document.getElementById('invoiceView');
const downloadPdfBtn = document.getElementById('downloadPdf');
const logoImg = document.getElementById('logo');

// Función para formatear la placa (Copy from app.js)
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

// Modificar el evento de input de la placa de búsqueda
document.getElementById('searchPlate').addEventListener('input', function(e) {
    let value = e.target.value;
    value = formatPlate(value);
    e.target.value = value;
});

// Search invoice
searchBtn.addEventListener('click', async () => {
    const plate = searchPlate.value;
    if (!plate) return;

    try {
        const snapshot = await database.ref(`invoices/${plate}`).once('value');
        const invoices = snapshot.val();

        if (invoices) {
            const invoiceArray = Object.entries(invoices).map(([id, invoice]) => ({
                id,
                ...invoice
            })).sort((a, b) => new Date(b.date) - new Date(a.date));

            displayInvoices(invoiceArray);
            downloadPdfBtn.style.display = 'block';
        } else {
            alert('No se encontró ninguna factura para esta placa');
            invoiceView.innerHTML = '';
            downloadPdfBtn.style.display = 'none';
        }
    } catch (error) {
        alert('Error al buscar la factura: ' + error.message);
    }
});

// Display multiple invoices
function displayInvoices(invoices) {
    invoiceView.innerHTML = invoices.map((invoice, index) => `
        <div class="invoice-container">
            <div class="invoice-header">
                <img src="images/logo.png" alt="Logo del Taller" class="invoice-logo">
                <h2>Factura de Repuestos #${index + 1}</h2>
                <p>Fecha: ${new Date(invoice.date).toLocaleDateString()}</p>
                <p>Placa: ${invoice.plate}</p>
                <p>Marca: ${invoice.brand || 'N/A'}</p>
                <p>Modelo: ${invoice.model || 'N/A'}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Repuesto</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${invoice.parts.map(part => `
                        <tr>
                            <td>${part.name}</td>
                            <td>${part.quantity}</td>
                            <td>$${part.price.toFixed(2)}</td>
                            <td>$${part.subtotal.toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="total">
                Total: $${invoice.total.toFixed(2)}
            </div>
            <button class="btn download-single-pdf" data-index="${index}">Descargar esta factura</button>
        </div>
    `).join('<hr class="invoice-separator">');

    // Agregar event listeners para los botones de descarga individual
    document.querySelectorAll('.download-single-pdf').forEach(button => {
        button.addEventListener('click', () => {
            const index = parseInt(button.dataset.index);
            const invoice = invoices[index];
            if (invoice) {
                generateSinglePDF(invoice);
            } else {
                 console.error('Factura no encontrada para descargar');
            }
        });
    });
}

// Generate single PDF
function generateSinglePDF(invoice) {
    try {
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
            startY: 80, // Adjust startY to accommodate new fields
            head: [['Repuesto', 'Cantidad', 'Precio Unitario', 'Subtotal']],
            body: invoice.parts.map(part => [
                part.name,
                part.quantity,
                `$${part.price.toFixed(2)}`,
                `$${part.subtotal.toFixed(2)}`
            ]),
            foot: [['', '', 'Total', `$${invoice.total.toFixed(2)}`]]
        });

        // Intentar agregar el logo desde la URL proporcionada
        const logo = new Image();
        logo.crossOrigin = 'Anonymous'; // Esto es importante para CORS
        logo.src = 'https://i.postimg.cc/25fBbNkQ/logonegro2.png';
        
        logo.onload = function() {
            // Calcular las dimensiones proporcionales
            const maxHeight = 20; // Altura máxima deseada en mm
            const ratio = logo.width / logo.height;
            const width = maxHeight * ratio;
            
            // Agregar la imagen con las dimensiones calculadas
            doc.addImage(logo, 'PNG', 10, 10, width, maxHeight);
            doc.save(`factura-${invoice.plate}-${new Date(invoice.date).toLocaleDateString()}.pdf`);
        };
         logo.onerror = function() {
             console.log('No se pudo agregar el logo al PDF desde la URL: https://i.postimg.cc/25fBbNkQ/logonegro2.png');
             // Guardar el PDF sin la imagen si hay un error
             doc.save(`factura-${invoice.plate}-${new Date(invoice.date).toLocaleDateString()}.pdf`);
        };

    } catch (error) {
        console.error('Error al generar el PDF:', error);
        alert('Error al generar el PDF. Por favor, intente nuevamente.');
    }
}

// Auto-execute search if plate is in URL query parameter on page load
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const plateFromUrl = urlParams.get('plate');
    if (plateFromUrl) {
        document.getElementById('searchPlate').value = plateFromUrl;
        document.getElementById('searchBtn').click();
    }
}; 