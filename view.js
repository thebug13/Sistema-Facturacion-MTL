// Firebase configuration (Copy from app.js)
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
                <img src="https://i.postimg.cc/25fBbNkQ/logonegro2.png" alt="Logo del Taller" class="invoice-logo">
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

        // Add logo and workshop info
        const logoUrl = 'https://i.postimg.cc/25fBbNkQ/logonegro2.png';
        const workshopName = 'Motos Loaiza';
        const workshopEmail = 'tecnipunto75@gmail.com';
        const workshopPhone = '+57 3103963556';

        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = logoUrl;

        img.onload = function() {
            const imgWidth = 20; // Reduced desired logo width in mm
            const imgHeight = (img.height * imgWidth) / img.width;
            doc.addImage(img, 'PNG', 10, 10, imgWidth, imgHeight);

            doc.setFontSize(10);
            doc.text(workshopName, 50, 15);
            doc.text(`Email: ${workshopEmail}`, 50, 20);
            doc.text(`Celular: ${workshopPhone}`, 50, 25);

            // Generate and save PDF content after image is loaded
            generatePdfContent(doc, invoice, 40 + imgHeight); // Adjust startY based on new smaller height
            doc.save(`factura-${invoice.plate}-${new Date(invoice.date).toLocaleDateString()}.pdf`);
        };

        img.onerror = function() {
            console.log('No se pudo agregar el logo al PDF desde la URL: https://i.postimg.cc/25fBbNkQ/logonegro2.png');
            // If logo fails to load, generate PDF without it
            generatePdfContent(doc, invoice);
        };

         // Function to generate PDF content (excluding logo which is async)
        function generatePdfContent(doc, invoice, startY) {
            let y = startY;

            // Ensure a minimum starting position, allowing space for header/logo if they load
            if (y < 35) { // Start at least 35mm from the top
                y = 35;
            }

            doc.setFontSize(12);
            doc.text(`Fecha: ${new Date(invoice.date).toLocaleDateString()}`, 10, y); y += 7;
            doc.text(`Placa: ${invoice.plate}`, 10, y); y += 7;
            doc.text(`Marca: ${invoice.brand || 'N/A'}`, 10, y); y += 7;
            doc.text(`Modelo: ${invoice.model || 'N/A'}`, 10, y); y += 15; // Space after details

            // Manually add Parts List with lines
            doc.setFontSize(10);
            const partHeight = 8; // Total height allocated for each part row (text + padding)
            const lineThickness = 0.1; // Approximate line thickness in mm

            invoice.parts.forEach((part, index) => {
                if (index > 0) {
                    y += partHeight / 2; // Space before line
                    doc.line(10, y, 200, y);
                    y += partHeight / 2; // Space after the line
                }

                // Add part details - text baseline will be relative to current y
                const textY = y + (partHeight / 2); // Position text vertically in the middle of the allocated height
                doc.text(part.name, 15, textY); // Description
                doc.text(part.quantity.toString(), 100, textY, { align: 'center' }); // Cantidad
                doc.text(`COP$${part.price.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 150, textY, { align: 'right' }); // Precio Unitario
                doc.text(`COP$${part.subtotal.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 200, textY, { align: 'right' }); // Subtotal

                // Move y down by the total height for this part row
                y += partHeight;
            });

            // Draw a line after the last part item
            y += partHeight / 2; // Space before final line
            doc.line(10, y, 200, y);
            y += 10; // Space after the last line before total

            // Add Total
            doc.setFontSize(12);
            doc.text(`Total: COP$${invoice.total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, 200, y, { align: 'right' });

            // Position copyright notice relative to the bottom
            const pageHeight = doc.internal.pageSize.height;
            const pageWidth = doc.internal.pageSize.width;
            const copyrightY = pageHeight - 10; // 10mm from the bottom
            doc.setFontSize(10);
            doc.text('© 2025 Motos Loaiza | Powered by Felipe Loaiza', pageWidth / 2, copyrightY, { align: 'center' });

            // Save PDF
            doc.save(`factura-${invoice.plate}-${new Date(invoice.date).toLocaleDateString()}.pdf`);
        }

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