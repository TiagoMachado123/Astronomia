// --- /public/js/utils.js ---
// --- FUNÇÕES AUXILIARES (UTILS) ---

// Gera o HTML para pré-visualização de documentos (PDF ou Imagem)
function generatePreviewHTML(dbPath) {
    if (!dbPath) return null;

    // Limpar o caminho e garantir formato correto
    const cleanPath = "/" + dbPath.replace(/\\/g, "/").replace(/^public\//, "");

    // Descobrir a extensão
    const extension = cleanPath.split('.').pop().toLowerCase();
    let html = `<div class="doc-preview-container">`;

    if (extension === 'pdf') {
        html += `<iframe src="${cleanPath}" class="doc-preview-pdf"></iframe>`;
    }
    else if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
        html += `<img src="${cleanPath}" class="doc-preview-img" alt="Documento">`;
    }
    else {
        html += `<div style="padding: 20px; text-align: center; color: #aaa;">
                <i class="fa-solid fa-file-lines" style="font-size: 2rem;"></i>
                <p>Pré-visualização indisponível</p>
             </div>`;
    }

    // Botão Download
    html += `<div style="text-align: center; padding: 8px; background: rgba(0,0,0,0.3);">
                <a href="${cleanPath}" target="_blank" class="doc-download-btn">
                    <i class="fa-solid fa-expand"></i> Abrir / Download
                </a>
             </div>`;
    html += `</div>`;
    return html;
}