

// Elementos DOM
const stepWrapper = document.getElementById('stepWrapper');
const indicators = document.querySelectorAll('.step-dot');

const step1Div = document.getElementById("step1");
const step2Div = document.getElementById("step2");
const step1Msg = document.getElementById("step1Msg");
const step2Msg = document.getElementById("step2Msg");

const emailInput = document.getElementById("email");
const codeInput = document.getElementById("code");
const newPassInput = document.getElementById("newPassword");

const requestCodeBtn = document.getElementById("requestCode");
const confirmResetBtn = document.getElementById("confirmReset");
const backStepBtn = document.getElementById("backStep");
const backStepBtnSmall = document.getElementById("backStepBtnSmall");
const goHomeBtn = document.getElementById("goHome");

const stepText = document.getElementById('stepText');


// Mail notification
const mailNotification = document.getElementById('mailNotification');
const mailContent = document.getElementById('mailContent');
const closeMailBtn = document.getElementById('closeMail') || document.createElement('button');

// Test email sending (remove in production)

// Utility: show/hide status icons inside the input wrapper
function showStatusIcon(input, valid) {
    const wrapper = input.parentElement;
    const validIcon = wrapper.querySelector('.status-icon.valid');
    const invalidIcon = wrapper.querySelector('.status-icon.invalid');
    if (valid) {
        if (validIcon) validIcon.style.display = 'inline';
        if (invalidIcon) invalidIcon.style.display = 'none';
    } else {
        if (validIcon) validIcon.style.display = 'none';
        if (invalidIcon) invalidIcon.style.display = 'inline';
    }
}

// set step (1 or 2)
function setStep(step) {
    stepWrapper.style.transform = step === 1 ? 'translateX(0)' : 'translateX(-50%)';
    indicators.forEach((dot, i) => {
        dot.classList.remove('active','success','error');
        if (i === step - 1) dot.classList.add('active');
    });
    stepText.textContent = `Paso ${step} de 2`;
    // show/hide back button
    document.getElementById('backStep').style.display = step === 1 ? 'none' : 'inline-block';
}

// update indicator to success/error/active
function setStepIndicatorStatus(step, status) {
    const dot = indicators[step-1];
    dot.classList.remove('active','success','error');
    if (status === 'success') dot.classList.add('success');
    else if (status === 'error') dot.classList.add('error');
    else dot.classList.add('active');
}

// Show simulated mail popup
function showMailNotification(code, from = "serverfalsodecorreo") {
    mailContent.textContent = `Tu código es ${code} (válido 15 minutos).`;
    const header = mailNotification.querySelector('.mail-header strong');
    if (header) header.textContent = from;
    mailNotification.classList.remove('hidden');
    // animate in
    requestAnimationFrame(() => mailNotification.classList.add('show'));
    // auto hide
    setTimeout(() => {
        mailNotification.classList.remove('show');
        setTimeout(() => mailNotification.classList.add('hidden'), 500);
    }, 7000);
}

// Close mail manually
if (document.getElementById('closeMail')) {
    document.getElementById('closeMail').addEventListener('click', () => {
        mailNotification.classList.remove('show');
        setTimeout(() => mailNotification.classList.add('hidden'), 400);
    });
}

// Request code handler
requestCodeBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    step1Msg.textContent = "";
    showStatusIcon(emailInput, true);

    if (!email) {
        step1Msg.textContent = "Introduce tu correo.";
        showStatusIcon(emailInput, false);
        setStepIndicatorStatus(1,'error');
        return;
    }

    try {
        const res = await fetch("/password-reset/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email })
        });

        const data = await res.json();

        if (res.ok || res.status === 202) {
            // server returns code and from in JSON (server.js sends { message, code, from })
            const code = data.code || data?.data?.code || null;
            const from = data.from || "serverfalsodecorreo";

            if (code) {
                showMailNotification(code, from);
            }
            step1Msg.style.color = "#0f172a";
            step1Msg.textContent = data.message || "Código generado. Revisa la notificación.";
            showStatusIcon(emailInput, true);
            setStepIndicatorStatus(1,'success');

            // move to next step after a short delay to let user see msg
            setTimeout(() => setStep(2), 700);
        } else {
            step1Msg.style.color = "#ef4444";
            step1Msg.textContent = data.message || "Error enviando código";
            showStatusIcon(emailInput, false);
            setStepIndicatorStatus(1,'error');
        }
    } catch (err) {
        step1Msg.style.color = "#ef4444";
        step1Msg.textContent = "Error de conexión";
        console.error("RequestCode error:", err);
        showStatusIcon(emailInput, false);
        setStepIndicatorStatus(1,'error');
    }
});

// Confirm reset handler
confirmResetBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const code = codeInput.value.trim();
    const newPassword = newPassInput.value.trim();

    step2Msg.textContent = "";
    let valid = true;

    if (!code) { showStatusIcon(codeInput, false); valid = false; } else showStatusIcon(codeInput, true);
    if (!newPassword) { showStatusIcon(newPassInput, false); valid = false; } else showStatusIcon(newPassInput, true);

    if (!valid) {
        step2Msg.style.color = "#ef4444";
        step2Msg.textContent = "Completa todos los campos";
        setStepIndicatorStatus(2,'error');
        return;
    }

    try {
        const res = await fetch("/password-reset/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, code, password: newPassword })
        });

        const data = await res.json();

        if (res.ok) {
            step2Msg.style.color = "#10b981";
            step2Msg.textContent = "Contraseña restablecida correctamente.";
            showStatusIcon(codeInput, true);
            showStatusIcon(newPassInput, true);
            setStepIndicatorStatus(2,'success');
            setTimeout(() => window.location.href = "/", 1600);
        } else {
            step2Msg.style.color = "#ef4444";
            step2Msg.textContent = data.message || "Código inválido o expirado.";
            // mark code as invalid visually
            showStatusIcon(codeInput, false);
            setStepIndicatorStatus(2,'error');
        }
    } catch (err) {
        console.error("ConfirmReset error:", err);
        step2Msg.style.color = "#ef4444";
        step2Msg.textContent = "Error de conexión";
        setStepIndicatorStatus(2,'error');
    }
});

// Back to step 1
backStepBtn.addEventListener("click", () => {
    setStep(1);
    step2Msg.textContent = "";
    showStatusIcon(codeInput, true);
    showStatusIcon(newPassInput, true);
    setStepIndicatorStatus(2,'active');
});
document.getElementById('backStepBtnSmall').addEventListener('click', () => {
    setStep(1);
    step2Msg.textContent = "";
    showStatusIcon(codeInput, true);
    showStatusIcon(newPassInput, true);
});

// Go home
goHomeBtn.addEventListener("click", () => window.location.href = "/");

// Initialize UI
setStep(1);
// Volver a inicio desde step1
document.getElementById('goHomeStep1').addEventListener('click', () => {
    window.location.href = "/";
});
