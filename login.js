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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get Firebase Auth instance
const auth = firebase.auth();

// DOM Elements
const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');

// Handle login form submission
if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('email');
        const passwordInput = document.getElementById('password');

        const email = emailInput.value;
        const password = passwordInput.value;

        // Clear previous errors
        errorMessage.textContent = '';

        auth.signInWithEmailAndPassword(email, password)
            .then((userCredential) => {
                // Signed in successfully
                console.log('User signed in:', userCredential.user);
                // Redirect to index page
                window.location.href = 'index.html';
            })
            .catch((error) => {
                // Handle errors
                console.error('Login error:', error);
                let message = 'Error al iniciar sesión.';
                switch (error.code) {
                    case 'auth/user-not-found':
                    case 'auth/wrong-password':
                        message = 'Email o contraseña incorrectos.';
                        break;
                    case 'auth/invalid-email':
                        message = 'Formato de email inválido.';
                        break;
                    default:
                        message = `Error: ${error.message}`; // Display generic error if specific one is not handled
                }
                errorMessage.textContent = message;
            });
    });
} else {
    console.error('Login form not found!');
} 