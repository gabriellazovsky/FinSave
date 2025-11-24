// translations.js
const translations = {
    es: {
        welcome: "Bienvenido, ",
        profile: "Perfil",
        logout: "Cerrar sesión",
        email: "Correo",
        memberSince: "Miembro desde",
        save: "Guardar",
        editProfile: "Editar perfil",
        settings: "Configuración",
        language: "Idioma",
        currency: "Moneda",
        userProfile: "Perfil del Usuario",
        name: "Nombre",
        balance: "Balance",
        theme: "Tema",
        light: "Claro",
        dark: "Oscuro",
        saveChanges: "Guardar Cambios",
        profileSettings: "Ajustes",
        spanish: "Español",
        english: "Inglés"
    },
    en: {
        welcome: "Welcome, ",
        profile: "Profile",
        logout: "Sign Out",
        email: "Email",
        memberSince: "Member since",
        save: "Save",
        editProfile: "Edit profile",
        settings: "Settings",
        language: "Language",
        currency: "Currency",
        userProfile: "User Profile",
        name: "Name",
        balance: "Balance",
        theme: "Theme",
        light: "Light",
        dark: "Dark",
        saveChanges: "Save Changes",
        profileSettings: "Settings",
        spanish: "Spanish",
        english: "English"
    }
};

let currentLang = localStorage.getItem("lang") || "es";

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem("lang", lang);
    translatePage();
}

function translatePage() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
        const key = el.getAttribute("data-i18n");
        if (translations[currentLang][key]) {
            el.textContent = translations[currentLang][key];
        }
    });

    document.querySelectorAll("option[data-i18n]").forEach(option => {
        const key = option.getAttribute("data-i18n");
        if (translations[currentLang][key]) {
            option.textContent = translations[currentLang][key];
        }
    });
}

let currentCurrency = localStorage.getItem("currency") || "EUR";

function formatCurrency(amount) {
    const symbols = { EUR: "€", USD: "$", GBP: "£" };
    return `${symbols[currentCurrency]}${Number(amount).toFixed(2)}`;
}

function setCurrency(cur) {
    currentCurrency = cur;
    localStorage.setItem("currency", cur);
    if (typeof verHistorial === 'function') {
        verHistorial();
    }
}

// Cargar cuando la página esté lista
document.addEventListener("DOMContentLoaded", function() {
    // Configurar selectores
    const langSelect = document.getElementById("langSelect");
    const currencySelect = document.getElementById("currencySelect");

    if (langSelect) {
        langSelect.value = currentLang;
        langSelect.addEventListener("change", (e) => {
            setLanguage(e.target.value);
        });
    }

    if (currencySelect) {
        currencySelect.value = currentCurrency;
        currencySelect.addEventListener("change", (e) => {
            setCurrency(e.target.value);
        });
    }

    translatePage();
});