// --- /public/js/perfil.js ---
document.addEventListener("DOMContentLoaded", () => {
    // Apenas corre se estiver na página de perfil
    if (window.location.pathname.includes("perfil.html")) {
        loadMyProfile();
    }
});

function loadMyProfile() {
    fetch("/api/me")
        .then((res) => {
            if (res.status === 401 || res.status === 403) {
                window.location.href = "/";
                return null;
            }
            return res.json();
        })
        .then((user) => {
            if (!user) return;

            // Atualizar textos
            document.getElementById("display-name").textContent = user.nome;
            document.getElementById("display-email").textContent = user.email;
            document.getElementById("display-role").textContent = user.cargo || "Cadete Espacial";
            document.getElementById("display-bio").textContent = user.biografia || "Sem dados registados.";

            // Atualizar Imagem
            if (user.fotografia) {
                const cleanPath = "/" + user.fotografia.replace(/\\/g, "/").replace(/^public\//, "");
                document.getElementById("display-avatar").src = cleanPath;
            }

            // Preview do Documento (Usa função do utils.js)
            const previewContainer = document.getElementById("document-preview-area");
            if (previewContainer) {
                if (user.documento) {
                    previewContainer.innerHTML = generatePreviewHTML(user.documento);
                } else {
                    previewContainer.innerHTML = '<span style="font-size: 0.8rem; color: #555;">Nenhum documento carregado.</span>';
                }
            }

            // Preencher Inputs do Formulário
            document.getElementById("input-nome").value = user.nome;
            document.getElementById("input-telefone").value = user.telefone;
            document.getElementById("input-morada").value = user.morada;
            document.getElementById("input-biografia").value = user.biografia || "";
        })
        .catch(err => console.error("Erro ao carregar perfil:", err));
}