/* --- /public/js/comunidade.js --- */

// ==========================================
// VARIÁVEIS GLOBAIS
// ==========================================

let allPosts = [];
let currentUser = null;
let currentFilter = 'all'; // 'all', 'mine', 'liked'

// ==========================================
// INICIALIZAÇÃO
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // Inicializar Navbar Global (se existir)
    if (typeof loadNavbar === "function") loadNavbar();

    // Verificar se estamos na página de comunidade
    // (Verificação simplificada para funcionar mesmo que o URL mude ligeiramente)
    const feedElement = document.getElementById("posts-feed");
    if (!feedElement) return;

    // Carregar dados iniciais
    loadCurrentUser();
    loadPosts();

    // Configurar event listeners
    setupToggleForm();      // Novo (Integração Cód 1)
    setupQuickFilters();    // Novo (Integração Cód 1)
    setupFormListeners();
    setupFilterListeners(); // Filtros de categoria/ordenação
    setupImageUpload();
    setupModal();

    // Criar container de toasts
    createToastContainer();
});

// ==========================================
// 1. LÓGICA DE TOGGLE E FILTROS RÁPIDOS (INTEGRAÇÃO)
// ==========================================

function setupToggleForm() {
    const btnToggle = document.getElementById('btn-toggle-form');
    const btnClose = document.getElementById('btn-close-form'); // Botão no topo do form
    const createSection = document.getElementById('create-post-section');

    if (btnToggle && createSection) {
        btnToggle.addEventListener('click', () => {
            createSection.classList.remove('hidden');
            btnToggle.classList.add('hidden'); // Esconde o botão de abrir
            // Scroll suave até ao formulário
            createSection.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Função para fechar o formulário
    const closeForm = () => {
        if (createSection && btnToggle) {
            createSection.classList.add('hidden');
            btnToggle.classList.remove('hidden'); // Mostra o botão de abrir novamente
        }
    };

    if (btnClose) btnClose.addEventListener('click', closeForm);

    // Tornar a função acessível globalmente caso o HTML use onclick noutro sítio
    window.closePostForm = closeForm;
}

function setupQuickFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // UI: Remove active de todos e adiciona ao clicado
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Lógica: Atualiza filtro global e recarrega
            currentFilter = btn.dataset.filter;
            loadPosts();
        });
    });
}

// ==========================================
// CARREGAR UTILIZADOR ATUAL
// ==========================================

async function loadCurrentUser() {
    try {
        const response = await fetch("/api/me");
        // Se falhar (401), não redirecionamos forçosamente para não bloquear visitantes,
        // mas impedimos ações de postar.
        if (!response.ok) return;

        currentUser = await response.json();

        // Atualizar UI com dados do utilizador no form
        const nameEl = document.getElementById("current-user-name");
        const avatarEl = document.getElementById("current-user-avatar");

        if (nameEl) nameEl.textContent = currentUser.nome;

        if (avatarEl && currentUser.fotografia) {
            const cleanPath = "/" + currentUser.fotografia.replace(/\\/g, "/").replace(/^public\//, "");
            avatarEl.innerHTML = `<img src="${cleanPath}" alt="${currentUser.nome}" onerror="this.parentElement.innerHTML='<i class=\\'fa-solid fa-user-astronaut\\'></i>'">`;
        }

    } catch (error) {
        console.error("Erro ao carregar utilizador:", error);
    }
}

// ==========================================
// CARREGAR POSTS
// ==========================================

async function loadPosts() {
    const feedEl = document.getElementById("posts-feed");
    const loadingEl = document.getElementById("loading-indicator");
    const emptyEl = document.getElementById("empty-state");
    const countEl = document.getElementById("posts-count");

    try {
        // Mostrar loading
        if (loadingEl) loadingEl.style.display = "flex";
        if (emptyEl) emptyEl.classList.add("hidden");
        // Limpar feed visualmente enquanto carrega
        feedEl.innerHTML = '';
        if (feedEl.contains(loadingEl)) feedEl.appendChild(loadingEl);

        // Fetch com o filtro atual (all, mine, liked)
        const response = await fetch(`/api/posts?filter=${currentFilter}`);

        if (!response.ok) {
            throw new Error("Erro ao carregar posts");
        }

        allPosts = await response.json();

        // Esconder loading
        if (loadingEl) loadingEl.style.display = "none";

        // Atualizar contador total
        if (countEl) countEl.textContent = allPosts.length;

        // Renderizar posts
        renderPosts(allPosts);

    } catch (error) {
        console.error("Erro ao carregar posts:", error);
        if (loadingEl) loadingEl.style.display = "none";

        feedEl.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <h3>Erro de Comunicação</h3>
                <p>Não foi possível estabelecer ligação com a estação.</p>
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

    // Verificar se há posts
    if (posts.length === 0) {
        feedEl.innerHTML = "";
        if (emptyEl) {
            emptyEl.classList.remove("hidden");
            // Atualizar mensagem de vazio baseada no filtro
            const msgP = emptyEl.querySelector('p');
            if (msgP) {
                if (currentFilter === 'mine') msgP.textContent = "Ainda não fizeste nenhuma descoberta.";
                else if (currentFilter === 'liked') msgP.textContent = "Ainda não tens favoritos.";
                else msgP.textContent = "Sê o primeiro a partilhar uma descoberta cósmica!";
            }
        }
        return;
    }

    if (emptyEl) emptyEl.classList.add("hidden");

    // Gerar HTML dos posts
    feedEl.innerHTML = posts.map((post, index) => createPostHTML(post, index)).join("");

    // Re-anexar o loading indicator escondido para uso futuro
    const loadingHtml = `<div class="loading-indicator" id="loading-indicator" style="display:none;"><div class="loading-spinner"></div><span>A sincronizar...</span></div>`;
    feedEl.insertAdjacentHTML('beforeend', loadingHtml);

    // Configurar event listeners dinâmicos
    setupLikeButtons();
    setupDeleteButtons(); // Novo: Botões de eliminar
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

    const categoryName = post.categoria.charAt(0).toUpperCase() + post.categoria.slice(1);
    const categoryIcon = categoryIcons[post.categoria] || "📡";

    const isLiked = post.user_liked ? "liked" : "";
    const likeIcon = post.user_liked ? "fa-solid" : "fa-regular";

    const timeAgo = formatTimeAgo(post.data_criacao);

    // Lógica para mostrar botão de delete (Se for autor ou admin)
    // Assumimos que a API envia 'is_author' ou comparamos IDs se disponíveis
    let deleteBtnHtml = "";
    if (post.is_author === true || (currentUser && post.autor_id === currentUser.id)) {
        deleteBtnHtml = `
            <button class="action-btn btn-delete" data-post-id="${post.id}" title="Eliminar Transmissão">
                <i class="fa-solid fa-trash"></i>
            </button>
        `;
    }

    return `
        <article class="post-card" style="animation-delay: ${index * 0.1}s">
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
                            <span class="author-cargo">${escapeHtml(post.autor_cargo || "Viajante")}</span>
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
                    </div>
                
                <div style="display:flex; gap:10px; align-items:center;">
                    ${deleteBtnHtml}
                    <span class="post-timestamp">
                        <i class="fa-regular fa-calendar"></i>
                        ${formatDate(post.data_criacao)}
                    </span>
                </div>
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
            resetImagePreview();
        });
    }
}

function resetImagePreview() {
    const preview = document.getElementById("image-preview");
    const placeholder = document.querySelector(".upload-placeholder");
    const fileInput = document.getElementById("post-image-file");

    if (preview) {
        preview.classList.remove("active");
        preview.innerHTML = "";
    }
    if (placeholder) placeholder.style.display = "flex";
    if (fileInput) fileInput.value = "";
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
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> A publicar...';

        const formData = new FormData(form);

        // Tratamento especial se houver input de URL de imagem (fallback)
        const urlInput = document.getElementById('post-image');
        if (urlInput && urlInput.value) {
            formData.append('imagem_url', urlInput.value);
        }

        const response = await fetch("/api/posts", {
            method: "POST",
            body: formData
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Erro ao criar post");
        }

        showToast("Transmissão enviada com sucesso! 🚀", "success");

        // Limpar e fechar
        form.reset();
        resetImagePreview();

        // Fechar o form (Comportamento do Cód 1)
        const createSection = document.getElementById('create-post-section');
        const btnToggle = document.getElementById('btn-toggle-form');
        if (createSection) createSection.classList.add('hidden');
        if (btnToggle) btnToggle.classList.remove('hidden');

        // Resetar filtro para "Todos" ou "Meus" e recarregar
        loadPosts();

        // Scroll para o topo
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
// ELIMINAR POST (Novo)
// ==========================================

function setupDeleteButtons() {
    const deleteButtons = document.querySelectorAll(".btn-delete");

    deleteButtons.forEach(btn => {
        btn.addEventListener("click", async (e) => {
            if (!confirm("Tem a certeza que deseja eliminar esta transmissão do registo?")) return;

            const postId = btn.dataset.postId;
            const card = btn.closest('.post-card');

            try {
                const res = await fetch(`/api/posts/${postId}`, { method: 'DELETE' });
                if (res.ok) {
                    showToast("Post eliminado com sucesso.", "success");
                    // Animação de saída
                    card.style.transition = "all 0.5s ease";
                    card.style.opacity = "0";
                    card.style.transform = "translateX(50px)";
                    setTimeout(() => {
                        card.remove();
                        // Se não sobrarem posts, recarregar para mostrar estado vazio
                        if (document.querySelectorAll('.post-card').length === 0) loadPosts();
                    }, 500);
                } else {
                    const data = await res.json();
                    throw new Error(data.error || "Não foi possível eliminar.");
                }
            } catch (err) {
                console.error(err);
                showToast(err.message, "error");
            }
        });
    });
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

    // Feedback Imediato (Otimista)
    const isLiked = btn.classList.contains('liked');
    let currentCount = parseInt(countEl.textContent);

    // Toggle visual provisório
    btn.classList.toggle('liked');
    iconEl.className = isLiked ? "fa-regular fa-heart" : "fa-solid fa-heart";
    countEl.textContent = isLiked ? Math.max(0, currentCount - 1) : currentCount + 1;

    try {
        const response = await fetch(`/api/posts/${postId}/like`, { method: "POST" });

        if (!response.ok) {
            throw new Error("Erro na rede");
        }

        const result = await response.json();

        // Atualizar com dados reais do servidor
        if (result.liked) {
            btn.classList.add("liked");
            iconEl.className = "fa-solid fa-heart";
        } else {
            btn.classList.remove("liked");
            iconEl.className = "fa-regular fa-heart";
        }
        countEl.textContent = result.totalLikes;

    } catch (error) {
        // Reverter em caso de erro
        console.error("Erro ao dar like:", error);
        showToast("Erro ao comunicar com o servidor", "error");

        // Reverter UI
        btn.classList.toggle('liked');
        iconEl.className = isLiked ? "fa-solid fa-heart" : "fa-regular fa-heart";
        countEl.textContent = currentCount;
    }
}

// ==========================================
// FILTROS COMBINADOS (Categoria / Ordenação)
// ==========================================

function setupFilterListeners() {
    const categoryFilter = document.getElementById("filter-category");
    const sortOrder = document.getElementById("sort-order");

    if (categoryFilter) categoryFilter.addEventListener("change", applyLocalFilters);
    if (sortOrder) sortOrder.addEventListener("change", applyLocalFilters);
}

function applyLocalFilters() {
    // Esta função filtra os posts JÁ carregados (allPosts)
    // Útil para filtrar por categoria sem bater na API novamente,
    // mas respeitando o "Setor" atual (Todos/Meus/Liked)

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
    // Atenção: Usei "post-image-file" no HTML integrado para diferenciar do ID de URL
    const fileInput = document.getElementById("post-image-file") || document.getElementById("post-image");
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
            if (placeholder) placeholder.style.display = "none";

            // Botão de remover
            preview.querySelector(".remove-image").addEventListener("click", (e) => {
                e.stopPropagation();
                resetImagePreview();
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

    if (closeBtn) closeBtn.addEventListener("click", closeModal);
    if (overlay) overlay.addEventListener("click", closeModal);

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
// FUNÇÕES AUXILIARES (UTILS)
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