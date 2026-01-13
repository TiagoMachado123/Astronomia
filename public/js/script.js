// public/js/script.js
// --- VARIÁVEL GLOBAL PARA A PESQUISA ---
let allCrewMembers = [];
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  // --- 0. INJETAR O HEADER ---
  // Injeta o header em todas as páginas exceto Login (root/index) e Registo
  if (path !== "/" && !path.includes("index.html") && !path.includes("registo.html")) {
    injectHeader();
    setupDropdownLogic(); // Ativa o menu dropdown do perfil
  }
  // --- 1. Geração de Estrelas e Scroll ---
  const starContainer = document.getElementById("star-container");
  if (starContainer) {
    for (let i = 0; i < 60; i++) {
      const star = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      star.setAttribute("viewBox", "0 0 24 24");
      star.classList.add("star");
      star.style.left = Math.random() * 100 + "vw";
      star.style.top = Math.random() * 100 + "vh";
      const size = Math.random() * 15 + 5;
      star.style.width = size + "px";
      star.style.height = size + "px";
      star.style.setProperty("--duration", Math.random() * 3 + 2 + "s");
      star.innerHTML = '<path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/>';
      starContainer.appendChild(star);
    }
  }
  // --- 2. Smooth Scroll ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });
  // --- 3. Animações (Observer) ---
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".hidden").forEach((el) => observer.observe(el));
  // --- 4. Navbar Dinâmica (Conteúdo) ---
  const navContainer = document.getElementById("dynamic-nav");
  if (navContainer) {
    // Páginas Públicas
    if (path === "/" || path.includes("index.html") || path.includes("login.html")) {
      navContainer.innerHTML = '';
    }
    // Página de Registo
    else if (path.includes("registo.html")) {
      navContainer.innerHTML = `
            <a href="/" class="nav-item">
                <i class="fa-solid fa-arrow-left"></i> Voltar ao Login
            </a>`;
    }
    // Páginas Privadas (Dashboard, etc.)
    else {
      // Função auxiliar para verificar se o link está ativo
      const isActive = (p) => path.includes(p) ? 'active' : '';
      navContainer.innerHTML = `
            <a href="/dashboard.html" class="nav-item ${isActive('dashboard.html')}">Início</a>
            <a href="/astronomia.html" class="nav-item ${isActive('astronomia.html')}">Curiosidades</a>
            <a href="/visualizacao.html" class="nav-item ${isActive('visualizacao.html')}">Tripulação</a>
            
            <div class="user-menu-container">
                <div class="user-avatar-btn" id="profile-trigger">
                    <i class="fa-solid fa-user-astronaut"></i>
                </div>
                
                <div class="profile-dropdown" id="profile-dropdown">
                    <a href="/perfil.html" class="${isActive('perfil.html')}">
                        <i class="fa-solid fa-id-card"></i> O meu Perfil
                    </a>
                    <div class="dropdown-divider"></div>
                    <a href="/logout" style="color: #ff6b6b;">
                        <i class="fa-solid fa-power-off"></i> Terminar Missão
                    </a>
                </div>
            </div>
        `;
    }
  }

  // --- 5. Lógica de Formulários (Registo) ---
  const regForm = document.querySelector('form[action="/registo"]');
  if (regForm) {
    regForm.addEventListener("submit", function (e) {
      const inputs = regForm.querySelectorAll("input, select");
      let valid = true;
      inputs.forEach((input) => {
        if (input.hasAttribute('required') && !input.value) valid = false;
      });
      const email = regForm.querySelector('input[name="email"]').value;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!valid) {
        e.preventDefault();
        alert("Por favor, preenche todos os campos obrigatórios.");
      } else if (!emailRegex.test(email)) {
        e.preventDefault();
        alert("Email inválido.");
      }
    });
    const btnClear = document.getElementById("btn-limpar");
    if (btnClear) {
      btnClear.addEventListener("click", () => regForm.reset());
    }
  }
  // --- 6. Carregamento Condicional por Página ---
  // Se estiver na página de Perfil -> Carregar dados do próprio user
  if (path.includes("perfil.html")) {
    loadMyProfile();
  }
  // Se estiver na página de Visualização -> Carregar lista de tripulação
  if (path.includes("visualizacao.html")) {
    loadUsers(observer);
  }
  // Nota: O toggle de curiosidade agora está no próprio astronomia.html
  // para funcionar independentemente
});
// ==========================================
//           FUNÇÕES AUXILIARES
// ==========================================
function injectHeader() {
  const header = document.createElement("header");
  header.innerHTML = `
      <div class="container nav-wrapper">
        <a href="/dashboard.html" class="logo">
          <i class="fa-solid fa-rocket"></i> Astronomia Explorer
        </a>
        <div id="dynamic-nav" class="nav-links"></div>
      </div>
    `;
  document.body.prepend(header);
}
// LÓGICA DO DROPDOWN (Menu do Avatar)
function setupDropdownLogic() {
  setTimeout(() => {
    const trigger = document.getElementById("profile-trigger");
    const dropdown = document.getElementById("profile-dropdown");
    if (trigger && dropdown) {
      // 1. Alternar menu ao clicar no ícone
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("active");
      });
      // 2. Fechar menu ao clicar fora
      document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
          dropdown.classList.remove("active");
        }
      });
    }
  }, 100);
}
// --- FUNÇÃO DE PREVIEW DE DOCUMENTOS (PDF/IMAGEM) ---
function generatePreviewHTML(dbPath) {
  if (!dbPath) return null;
  // Limpar o caminho
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
// --- CARREGAR O MEU PERFIL ---
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
      document.getElementById("display-name").textContent = user.nome;
      document.getElementById("display-email").textContent = user.email;
      document.getElementById("display-role").textContent = user.cargo || "Cadete Espacial";
      document.getElementById("display-bio").textContent = user.biografia || "Sem dados registados.";
      if (user.fotografia) {
        const cleanPath = "/" + user.fotografia.replace(/\\/g, "/").replace(/^public\//, "");
        document.getElementById("display-avatar").src = cleanPath;
      }
      // Preview do Documento no Perfil
      const previewContainer = document.getElementById("document-preview-area");
      if (previewContainer) {
        if (user.documento) {
          previewContainer.innerHTML = generatePreviewHTML(user.documento);
        } else {
          previewContainer.innerHTML = '<span style="font-size: 0.8rem; color: #555;">Nenhum documento carregado.</span>';
        }
      }
      // Preencher Inputs
      document.getElementById("input-nome").value = user.nome;
      document.getElementById("input-telefone").value = user.telefone;
      document.getElementById("input-morada").value = user.morada;
      document.getElementById("input-biografia").value = user.biografia || "";
    })
    .catch(err => console.error("Erro ao carregar perfil:", err));
}
// --- CARREGAR TRIPULAÇÃO (COM FILTROS) ---
function loadUsers(observer) {
  const grid = document.getElementById("user-grid-container");
  const searchInput = document.getElementById("crew-search");
  const roleFilter = document.getElementById("crew-role-filter");
  if (!grid) return;
  fetch("/getutilizadores")
    .then((res) => res.json())
    .then((users) => {
      allCrewMembers = users; // Guardar na variável global
      // Renderizar tudo inicialmente
      renderGrid(allCrewMembers, grid, observer);
      // Ativar lógica de filtros se os inputs existirem
      if (searchInput && roleFilter) {
        setupFilters(grid, observer);
      }
    })
    .catch((err) => {
      console.error(err);
      grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 60px; color: #aaa;">
          <i class="fa-solid fa-satellite-dish" style="font-size: 3rem; margin-bottom: 20px; display: block; color: var(--accent-pink);"></i>
          <p style="font-size: 1.2rem;">Erro ao estabelecer comunicação com a base de dados.</p>
          <p style="margin-top: 10px;">Tenta novamente mais tarde.</p>
        </div>`;
    });
}
// --- LÓGICA DE FILTRAGEM ---
function setupFilters(grid, observer) {
  const searchInput = document.getElementById("crew-search");
  const roleFilter = document.getElementById("crew-role-filter");
  const filterFunction = () => {
    const searchTerm = searchInput.value.toLowerCase().trim();
    const selectedRole = roleFilter.value;
    const filteredUsers = allCrewMembers.filter(user => {
      const nameMatch = user.nome.toLowerCase().includes(searchTerm);
      // Verifica se o cargo do user contém a seleção 
      const roleMatch = selectedRole === "" || (user.cargo && user.cargo.includes(selectedRole));
      return nameMatch && roleMatch;
    });
    renderGrid(filteredUsers, grid, observer);

    // Atualizar contador
    const countNumber = document.getElementById("results-count-number");
    if (countNumber) {
      countNumber.textContent = filteredUsers.length;
    }
  };
  searchInput.addEventListener("input", filterFunction);
  roleFilter.addEventListener("change", filterFunction);
}
// --- DESENHAR A GRELHA (RENDER) ---
function renderGrid(users, grid, observer) {
  grid.innerHTML = "";
  // Atualizar contador e mostrar info
  const resultsInfo = document.getElementById("results-info");
  const countNumber = document.getElementById("results-count-number");

  if (resultsInfo) {
    resultsInfo.style.display = "flex";
  }

  if (countNumber) {
    countNumber.textContent = users.length;
  }
  if (users.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 60px; color: #aaa;">
        <i class="fa-solid fa-user-slash" style="font-size: 3rem; margin-bottom: 20px; display: block; color: var(--accent-pink);"></i>
        <p style="font-size: 1.2rem; margin-bottom: 10px;">Nenhum tripulante encontrado</p>
        <p style="color: #666;">Tenta ajustar os filtros de pesquisa.</p>
      </div>`;
    return;
  }
  users.forEach((user, index) => {
    const imgPath = user.fotografia
      ? "/" + user.fotografia.replaceAll("\\", "/").replace(/^public\//, "")
      : "img/default.png";
    const cargo = user.cargo || "Cadete Espacial";
    const bio = user.biografia || "Novo explorador pronto para a missão.";
    // Gerar Preview do Documento
    let docHTML = "";
    if (user.documento) {
      docHTML = generatePreviewHTML(user.documento);
    }
    const card = document.createElement("div");
    card.className = "crew-card hidden";
    card.style.animationDelay = `${index * 0.1}s`;
    card.innerHTML = `
      <div class="crew-badge">${cargo}</div>
      <div class="crew-avatar-container">
        <img src="${imgPath}" alt="${user.nome}" class="crew-avatar" onerror="this.src='img/default.png'">
      </div>
      <h3 class="crew-name">${user.nome}</h3>
      
      <div class="crew-bio">"${bio}"</div>
      ${docHTML ? `<div style="margin-top: auto;">${docHTML}</div>` : ''}
    `;
    grid.appendChild(card);
    if (observer) observer.observe(card);
  });
}