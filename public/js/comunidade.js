/* --- /public/js/comunidade.js --- */

// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================

let allPosts = [];
let currentUser = null;

// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // Verificar se estamos na página de comunidade
    if (!window.location.pathname.includes("comunidade.html")) return;

    // Carregar dados iniciais
    loadCurrentUser();
    loadPosts();

    // Configurar event listeners
    setupFormListeners();
    setupFilterListeners();
    setupImageUpload();
    setupModal();

    // Criar container de toasts
    createToastContainer();
});

// ==========================================
// CARREGAR UTILIZADOR ATUAL
// ==========================================

async function loadCurrentUser() {
    try {
        const response = await fetch("/api/me");
        if (!response.ok) {
            window.location.href = "/";
            return;
        }

        currentUser = await response.json();

        // Atualizar UI com dados do utilizador
        const nameEl = document.getElementById("current-user-name");
        const avatarEl = document.getElementById("current-user-avatar");

        if (nameEl) nameEl.textContent = currentUser.nome;

        if (avatarEl && currentUser.fotografia) {
            const cleanPath = "/" + currentUser.fotografia.replace(/\\/g, "/").replace(/^public\//, "");
            avatarEl.innerHTML = `<img src="${cleanPath}" alt="${currentUser.nome}" onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-user-astronaut\\'></i>'">`;
        }

    } catch (error) {
        console.error("Erro ao carregar utilizador:", error);
        showToast("Erro ao carregar dados do utilizador", "error");
    }
}

// ==========================================
// CARREGAR POSTS
// ==========================================

async function loadPosts() {
    const feedEl = document.getElementById("posts-feed");
    const loadingEl = document.getElementById("loading-indicator");
    const emptyEl = document.getElementById("empty-state");

    try {
        // Mostrar loading
        if (loadingEl) loadingEl.style.display = "flex";
        if (emptyEl) emptyEl.classList.add("hidden");

        const response = await fetch("/api/posts");
        
        if (!response.ok) {
            throw new Error("Erro ao carregar posts");
        }

        allPosts = await response.json();

        // Esconder loading
        if (loadingEl) loadingEl.style.display = "none";

        // Renderizar posts
        renderPosts(allPosts);

    } catch (error) {
        console.error("Erro ao carregar posts:", error);
        if (loadingEl) loadingEl.style.display = "none";
        
        feedEl.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>Erro de Comunicação</h3>
                <p>Não foi possível estabelecer ligação com a estação. Tenta novamente.</p>
                <button class="btn btn-primary" onclick="loadPosts()">
                    <i class="fa-solid fa-rotate"></i> Tentar Novamente
                </button>
            </div>
        `;
    }
}

// ==========================================
// RENDERIZAR POSTS
// ==========================================

function renderPosts(posts) {
    const feedEl = document.getElementById("posts-feed");
    const emptyEl = document.getElementById("empty-state");
    const countEl = document.getElementById("posts-count");

    // Atualizar contador
    if (countEl) countEl.textContent = posts.length;

    // Verificar se há posts
    if (posts.length === 0) {
        feedEl.innerHTML = "";
        if (emptyEl) emptyEl.classList.remove("hidden");
        return;
    }

    if (emptyEl) emptyEl.classList.add("hidden");

    // Gerar HTML dos posts
    feedEl.innerHTML = posts.map((post, index) => createPostHTML(post, index)).join("");

    // Configurar event listeners dos botões de like
    setupLikeButtons();

    // Configurar clique nas imagens
    setupImageClicks();
}

function createPostHTML(post, index) {
    const avatarPath = post.autor_foto 
        ? "/" + post.autor_foto.replace(/\\/g, "/").replace(/^public\//, "")
        : null;

    const postImagePath = post.imagem 
        ? "/" + post.imagem.replace(/\\/g, "/").replace(/^public\//, "")
        : null;

    const categoryIcons = {
        "observacao": "🔭",
        "descoberta": "🌟",
        "fotografia": "📷",
        "evento": "🌑",
        "discussao": "💬",
        "duvida": "❓"
    };

    const categoryNames = {
        "observacao": "Observação",
        "descoberta": "Descoberta",
        "fotografia": "Astrofotografia",
        "evento": "Evento",
        "discussao": "Discussão",
        "duvida": "Dúvida"
    };

    const categoryIcon = categoryIcons[post.categoria] || "📡";
    const categoryName = categoryNames[post.categoria] || post.categoria;

    const isLiked = post.user_liked ? "liked" : "";
    const likeIcon = post.user_liked ? "fa-solid" : "fa-regular";

    const timeAgo = formatTimeAgo(post.data_criacao);

    return `
        <article class="post-card" style="animation-delay: ${index * 0.1}s" data-post-id="${post.id}">
            <div class="post-header">
                <div class="post-author">
                    <div class="author-avatar">
                        ${avatarPath 
                            ? `<img src="${avatarPath}" alt="${post.autor_nome}" onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-user-astronaut\\'></i>'">`
                            : `<i class="fa-solid fa-user-astronaut"></i>`
                        }
                    </div>
                    <div class="author-info">
                        <h4>${escapeHtml(post.autor_nome)}</h4>
                        <div class="author-meta">
                            <span class="author-cargo">${escapeHtml(post.autor_cargo || "Cadete")}</span>
                            <span><i class="fa-regular fa-clock"></i> ${timeAgo}</span>
                        </div>
                    </div>
                </div>
                <span class="post-category">
                    ${categoryIcon} ${categoryName}
                </span>
            </div>

            <div class="post-body">
                <h3 class="post-title">${escapeHtml(post.titulo)}</h3>
                <p class="post-content">${escapeHtml(post.conteudo)}</p>
            </div>

            ${postImagePath ? `
                <div class="post-image" data-image="${postImagePath}">
                    <img src="${postImagePath}" alt="Imagem do post" loading="lazy">
                    <span class="expand-icon"><i class="fa-solid fa-expand"></i></span>
                </div>
            ` : ""}

            <div class="post-footer">
                <div class="post-actions">
                    <button class="action-btn like-btn ${isLiked}" data-post-id="${post.id}">
                        <i class="${likeIcon} fa-heart"></i>
                        <span class="like-count">${post.likes || 0}</span>
                    </button>
                    <button class="action-btn share-btn" data-post-id="${post.id}">
                        <i class="fa-solid fa-share-nodes"></i>
                        Partilhar
                    </button>
                </div>
                <span class="post-timestamp">
                    <i class="fa-regular fa-calendar"></i>
                    ${formatDate(post.data_criacao)}
                </span>
            </div>
        </article>
    `;
}

// ==========================================
// CRIAR NOVO POST
// ==========================================

function setupFormListeners() {
    const form = document.getElementById("new-post-form");
    const clearBtn = document.getElementById("btn-clear-post");

    if (form) {
        form.addEventListener("submit", handlePostSubmit);
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            form.reset();
            const preview = document.getElementById("image-preview");
            const placeholder = document.querySelector(".upload-placeholder");
            if (preview) {
                preview.classList.remove("active");
                preview.innerHTML = "";
            }
            if (placeholder) placeholder.style.display = "flex";
        });
    }
}

async function handlePostSubmit(e) {
    e.preventDefault();

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;

    // Validação básica
    const titulo = form.querySelector("#post-title").value.trim();
    const conteudo = form.querySelector("#post-content").value.trim();

    if (!titulo || !conteudo) {
        showToast("Preenche o título e a descrição", "error");
        return;
    }

    try {
        // Mostrar loading no botão
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A publicar...';

        const formData = new FormData(form);

        const response = await fetch("/api/posts", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Erro ao criar post");
        }

        // Sucesso!
        showToast("Transmissão enviada com sucesso! 🚀", "success");

        // Limpar formulário
        form.reset();
        const preview = document.getElementById("image-preview");
        const placeholder = document.querySelector(".upload-placeholder");
        if (preview) {
            preview.classList.remove("active");
            preview.innerHTML = "";
        }
        if (placeholder) placeholder.style.display = "flex";

        // Recarregar posts
        await loadPosts();

        // Scroll para o topo do feed
        document.getElementById("posts-feed").scrollIntoView({ behavior: "smooth" });

    } catch (error) {
        console.error("Erro ao criar post:", error);
        showToast(error.message || "Erro ao publicar. Tenta novamente.", "error");
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ==========================================
// SISTEMA DE LIKES
// ==========================================

function setupLikeButtons() {
    const likeButtons = document.querySelectorAll(".like-btn");

    likeButtons.forEach(btn => {
        btn.addEventListener("click", handleLike);
    });
}

async function handleLike(e) {
    const btn = e.currentTarget;
    const postId = btn.dataset.postId;
    const countEl = btn.querySelector(".like-count");
    const iconEl = btn.querySelector("i");

    try {
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: "POST"
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Erro ao dar like");
        }

        // Atualizar UI
        if (result.liked) {
            btn.classList.add("liked");
            iconEl.className = "fa-solid fa-heart";
        } else {
            btn.classList.remove("liked");
            iconEl.className = "fa-regular fa-heart";
        }

        countEl.textContent = result.totalLikes;

    } catch (error) {
        console.error("Erro ao dar like:", error);
        showToast("Erro ao registar o teu voto", "error");
    }
}

// ==========================================
// FILTROS E ORDENAÇÃO
// ==========================================

function setupFilterListeners() {
    const categoryFilter = document.getElementById("filter-category");
    const sortOrder = document.getElementById("sort-order");

    if (categoryFilter) {
        categoryFilter.addEventListener("change", applyFilters);
    }

    if (sortOrder) {
        sortOrder.addEventListener("change", applyFilters);
    }
}

function applyFilters() {
    const categoryFilter = document.getElementById("filter-category").value;
    const sortOrder = document.getElementById("sort-order").value;

    let filteredPosts = [...allPosts];

    // Filtrar por categoria
    if (categoryFilter) {
        filteredPosts = filteredPosts.filter(post => post.categoria === categoryFilter);
    }

    // Ordenar
    switch (sortOrder) {
        case "recentes":
            filteredPosts.sort((a, b) => new Date(b.data_criacao) - new Date(a.data_criacao));
            break;
        case "antigos":
            filteredPosts.sort((a, b) => new Date(a.data_criacao) - new Date(b.data_criacao));
            break;
        case "populares":
            filteredPosts.sort((a, b) => (b.likes || 0) - (a.likes || 0));
            break;
    }

    renderPosts(filteredPosts);
}

// ==========================================
// UPLOAD DE IMAGEM
// ==========================================

function setupImageUpload() {
    const uploadArea = document.getElementById("image-upload-area");
    const fileInput = document.getElementById("post-image");
    const preview = document.getElementById("image-preview");
    const placeholder = document.querySelector(".upload-placeholder");

    if (!uploadArea || !fileInput) return;

    // Drag and Drop
    uploadArea.addEventListener("dragover", (e) => {
        e.preventDefault();
        uploadArea.classList.add("dragover");
    });

    uploadArea.addEventListener("dragleave", () => {
        uploadArea.classList.remove("dragover");
    });

    uploadArea.addEventListener("drop", (e) => {
        e.preventDefault();
        uploadArea.classList.remove("dragover");
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleImagePreview(files[0]);
        }
    });

    // Input change
    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            handleImagePreview(e.target.files[0]);
        }
    });

    function handleImagePreview(file) {
        // Validar tamanho (5MB)
        if (file.size > 5 * 1024 * 1024) {
            showToast("A imagem é demasiado grande. Máximo 5MB.", "error");
            fileInput.value = "";
            return;
        }

        // Validar tipo
        if (!file.type.startsWith("image/")) {
            showToast("Por favor, seleciona uma imagem válida.", "error");
            fileInput.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            preview.innerHTML = `
                <img src="${e.target.result}" alt="Preview">
                <button type="button" class="remove-image">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            `;
            preview.classList.add("active");
            placeholder.style.display = "none";

            // Botão de remover
            preview.querySelector(".remove-image").addEventListener("click", (e) => {
                e.stopPropagation();
                fileInput.value = "";
                preview.classList.remove("active");
                preview.innerHTML = "";
                placeholder.style.display = "flex";
            });
        };
        reader.readAsDataURL(file);
    }
}

// ==========================================
// MODAL DE IMAGEM
// ==========================================

function setupModal() {
    const modal = document.getElementById("image-modal");
    const modalImage = document.getElementById("modal-image");
    const closeBtn = document.getElementById("modal-close");
    const overlay = modal?.querySelector(".modal-overlay");

    if (closeBtn) {
        closeBtn.addEventListener("click", closeModal);
    }

    if (overlay) {
        overlay.addEventListener("click", closeModal);
    }

    // Fechar com ESC
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });

    function closeModal() {
        modal?.classList.remove("active");
        document.body.style.overflow = "";
    }
}

function setupImageClicks() {
    const postImages = document.querySelectorAll(".post-image");
    const modal = document.getElementById("image-modal");
    const modalImage = document.getElementById("modal-image");

    postImages.forEach(img => {
        img.addEventListener("click", () => {
            const imageSrc = img.dataset.image;
            if (modalImage && imageSrc) {
                modalImage.src = imageSrc;
                modal.classList.add("active");
                document.body.style.overflow = "hidden";
            }
        });
    });
}

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-PT", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}

function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now - date) / 1000);

    const intervals = {
        ano: 31536000,
        mês: 2592000,
        semana: 604800,
        dia: 86400,
        hora: 3600,
        minuto: 60
    };

    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            const plural = interval > 1 ? (unit === "mês" ? "es" : "s") : "";
            return `há ${interval} ${unit}${plural}`;
        }
    }

    return "agora mesmo";
}

// ==========================================
// SISTEMA DE TOASTS
// ==========================================

function createToastContainer() {
    if (!document.querySelector(".toast-container")) {
        const container = document.createElement("div");
        container.className = "toast-container";
        document.body.appendChild(container);
    }
}

function showToast(message, type = "info") {
    const container = document.querySelector(".toast-container");
    if (!container) return;

    const icons = {
        success: "fa-circle-check",
        error: "fa-circle-exclamation",
        info: "fa-circle-info"
    };

    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="fa-solid ${icons[type]}"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);

    // Remover após 4 segundos
    setTimeout(() => {
        toast.style.animation = "slideIn 0.4s ease reverse";
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}
