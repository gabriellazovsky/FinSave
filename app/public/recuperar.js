// Elementos
const stepWrapper = document.querySelector('.step-wrapper');
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
const goHomeBtn = document.getElementById("goHome");

const stepText = document.getElementById('stepText');

// Checks dinámicos
function showStatusIcon(input, valid) {
    const wrapper = input.parentElement;
    wrapper.querySelector('.valid').style.display = valid ? 'inline' : 'none';
    wrapper.querySelector('.invalid').style.display = valid ? 'none' : 'inline';
}

// Cambiar paso
function setStep(step) {
    stepWrapper.style.transform = step === 1 ? 'translateX(0)' : 'translateX(-50%)';
    indicators.forEach((dot, i) => {
        dot.classList.remove('active', 'success', 'error');
        if(i === step-1) dot.classList.add('active');
    });
    stepText.textContent = `Paso ${step} de 2`;
}

// Actualizar indicador según éxito/error
function setStepIndicatorStatus(step, status) {
    const dot = indicators[step-1];
    dot.classList.remove('active','success','error');
    if(status === 'success') dot.classList.add('success');
    else if(status === 'error') dot.classList.add('error');
    else dot.classList.add('active');
}

// Solicitar código
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

        if (res.ok) {
            step1Msg.style.color = "#3498db";
            step1Msg.textContent = "Código enviado. Revisa tu correo.";
            showStatusIcon(emailInput, true);
            setStepIndicatorStatus(1,'success');
            setTimeout(() => setStep(2), 800);
        } else {
            step1Msg.style.color = "#e74c3c";
            step1Msg.textContent = data.message || "Error enviando código";
            showStatusIcon(emailInput, false);
            setStepIndicatorStatus(1,'error');
        }
    } catch (err) {
        step1Msg.style.color = "#e74c3c";
        step1Msg.textContent = "Error de conexión";
        console.error(err);
        showStatusIcon(emailInput, false);
        setStepIndicatorStatus(1,'error');
    }
});

// Confirmar código y contraseña
confirmResetBtn.addEventListener("click", async () => {
    const email = emailInput.value.trim();
    const code = codeInput.value.trim();
    const newPassword = newPassInput.value.trim();

    step2Msg.textContent = "";
    let valid = true;

    if (!code) { showStatusIcon(codeInput, false); valid=false; } else showStatusIcon(codeInput, true);
    if (!newPassword) { showStatusIcon(newPassInput, false); valid=false; } else showStatusIcon(newPassInput, true);

    if (!valid) {
        step2Msg.style.color = "#e74c3c";
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
            step2Msg.style.color = "#4ecdc4";
            step2Msg.textContent = "Contraseña restablecida correctamente.";
            showStatusIcon(codeInput,true);
            showStatusIcon(newPassInput,true);
            setStepIndicatorStatus(2,'success');
            setTimeout(() => window.location.href = "/", 2000);
        } else {
            step2Msg.style.color = "#e74c3c";
            step2Msg.textContent = data.message || "Error al restablecer contraseña";
            if(data.invalidCode) showStatusIcon(codeInput,false);
            setStepIndicatorStatus(2,'error');
        }
    } catch (err) {
        step2Msg.style.color = "#e74c3c";
        step2Msg.textContent = "Error de conexión";
        console.error(err);
        setStepIndicatorStatus(2,'error');
    }
});

// Volver al paso anterior
backStepBtn.addEventListener("click", () => {
    setStep(1);
    step2Msg.textContent = "";
    showStatusIcon(codeInput, true);
    showStatusIcon(newPassInput, true);
});

// Volver a inicio
goHomeBtn.addEventListener("click", () => {
    window.location.href = "/";
});
