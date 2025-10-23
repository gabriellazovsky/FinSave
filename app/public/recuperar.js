const step1Div = document.getElementById("step1");
const step2Div = document.getElementById("step2");
const step1Msg = document.getElementById("step1Msg");
const step2Msg = document.getElementById("step2Msg");
const goHomeBtn = document.getElementById("goHome");

document.getElementById("requestCode").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    step1Msg.textContent = "";

    if (!email) {
        step1Msg.textContent = "Introduce tu correo.";
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
            step1Div.classList.remove("active");
            step2Div.classList.add("active");
            step2Msg.textContent = "Código enviado. Revisa tu correo.";
        } else {
            step1Msg.textContent = data.message || "Error enviando código";
        }
    } catch (err) {
        step1Msg.textContent = "Error de conexión";
        console.error(err);
    }
});

document.getElementById("confirmReset").addEventListener("click", async () => {
    const email = document.getElementById("email").value.trim();
    const code = document.getElementById("code").value.trim();
    const newPassword = document.getElementById("newPassword").value.trim();
    step2Msg.textContent = "";

    if (!code || !newPassword) {
        step2Msg.textContent = "Completa todos los campos";
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
            setTimeout(() => window.location.href = "/", 2000);
        } else {
            step2Msg.style.color = "#ff6b6b";
            step2Msg.textContent = data.message || "Error al restablecer contraseña";
        }
    } catch (err) {
        step2Msg.style.color = "#ff6b6b";
        step2Msg.textContent = "Error de conexión";
        console.error(err);
    }
});

goHomeBtn.addEventListener("click", () => {
    window.location.href = "/";
});
