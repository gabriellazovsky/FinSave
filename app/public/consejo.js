// LIGHT/DARK TOGGLE
const checkbox = document.getElementById("checkbox");
checkbox?.addEventListener("change", () => {
    document.body.classList.toggle("dark");
    localStorage.setItem("theme", document.body.classList.contains("dark") ? "dark" : "light");
});
if(localStorage.getItem("theme")==="dark"){document.body.classList.add("dark"); checkbox.checked=true;}
