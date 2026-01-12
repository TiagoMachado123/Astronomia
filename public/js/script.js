// public/js/script.js

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
    for (let i = 0; i < 50; i++) {
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
  });
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
      navContainer.innerHTML = `
            <a href="/dashboard.html" class="nav-item">Início</a>
            <a href="/astronomia.html" class="nav-item">Curiosidades</a>
            <a href="/visualizacao.html" class="nav-item">Tripulação</a>
            
            <div class="user-menu-container">
                <div class="user-avatar-btn" id="profile-trigger">
                    <i class="fa-solid fa-user-astronaut"></i>
                </div>
                
                <div class="profile-dropdown" id="profile-dropdown">
                    <a href="/perfil.html">
                        <i class="fa-solid fa-id-card"></i> O meu Perfil
                    </a>
                    <a href="/settings.html">
                        <i class="fa-solid fa-gear"></i> Configurações
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
        // Verifica se campos (exceto opcionais se houvesse) estão preenchidos
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

  // Curiosidades (Botão Toggle)
  const btnFact = document.getElementById("toggle-fact");
  const factBox = document.getElementById("fact-box");
  if (btnFact && factBox) {
    btnFact.addEventListener("click", () => {
      const isHidden = factBox.style.display === "none" || factBox.style.display === "";
      factBox.style.display = isHidden ? "block" : "none";
      btnFact.textContent = isHidden ? "Esconder Curiosidade" : "Mostrar Curiosidade Extra";
    });
  }

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

// CARREGAR O MEU PERFIL (Rota Segura /api/me)
function loadMyProfile() {
  fetch("/api/me")
    .then((res) => {
      if (res.status === 401 || res.status === 403) {
        window.location.href = "/"; // Se não autorizado, manda para login
        return null;
      }
      return res.json();
    })
    .then((user) => {
      if (!user) return;

      // --- Preencher Visualização (Esquerda) ---
      document.getElementById("display-name").textContent = user.nome;
      document.getElementById("display-email").textContent = user.email;
      document.getElementById("display-role").textContent = user.cargo || "Cadete Espacial";
      document.getElementById("display-bio").textContent = user.biografia || "Sem dados registados.";

      // Imagem
      if (user.fotografia) {
        const cleanPath = "/" + user.fotografia.replace(/\\/g, "/").replace(/^public\//, "");
        document.getElementById("display-avatar").src = cleanPath;
      }

      // Botão Documento
      const btnDoc = document.getElementById("btn-view-doc");
      if (user.documento) {
        const docPath = "/" + user.documento.replace(/\\/g, "/").replace(/^public\//, "");
        btnDoc.href = docPath;
        btnDoc.style.display = "inline-block";
      } else {
        btnDoc.style.display = "none";
      }

      // --- Preencher Formulário de Edição (Direita) ---
      document.getElementById("input-nome").value = user.nome;
      document.getElementById("input-telefone").value = user.telefone;
      document.getElementById("input-morada").value = user.morada;
      document.getElementById("input-biografia").value = user.biografia || "";
    })
    .catch(err => console.error("Erro ao carregar perfil:", err));
}

// CARREGAR TRIPULAÇÃO (Visualização Geral)
function loadUsers(observer) {
  const grid = document.getElementById("user-grid-container");
  if (!grid) return;

  fetch("/getutilizadores")
    .then((res) => res.json())
    .then((users) => {
      grid.innerHTML = "";

      if (users.length === 0) {
        grid.innerHTML = "<p>Nenhum explorador encontrado. A tripulação está vazia.</p>";
        return;
      }

      users.forEach((user) => {
        // Tratamento da Imagem
        const imgPath = user.fotografia
          ? "/" + user.fotografia.replaceAll("\\", "/").replace(/^public\//, "")
          : "img/default.png";

        // Tratamento do Documento (Botão)
        let docButtonHTML = "";
        if (user.documento) {
          const docPath = "/" + user.documento.replaceAll("\\", "/").replace(/^public\//, "");
          docButtonHTML = `
                <a href="${docPath}" target="_blank" class="btn-sm btn-outline" style="margin-top: 15px; border-color: var(--accent-pink); color: var(--accent-pink); display:inline-block; font-size: 0.8rem;">
                    <i class="fa-solid fa-file-contract"></i> Ver Documento
                </a>
            `;
        }

        const cargo = user.cargo || "Cadete Espacial";
        const bio = user.biografia || "Sem dados biográficos.";

        const card = document.createElement("div");
        card.className = "crew-card hidden";

        // Layout: Badge -> Avatar -> Nome -> Biografia -> Documento
        card.innerHTML = `
          <div class="crew-badge">${cargo}</div>
          
          <div class="crew-avatar-container">
            <img src="${imgPath}" alt="${user.nome}" class="crew-avatar">
          </div>
          
          <h3 class="crew-name">${user.nome}</h3>
          
          <div class="crew-bio" style="margin: 15px 0; min-height: 40px;">
            "${bio}"
          </div>

          ${docButtonHTML}
        `;

        grid.appendChild(card);
        if (observer) observer.observe(card);
      });
    })
    .catch((err) => {
      console.error(err);
      grid.innerHTML = "<p>Erro ao carregar dados da missão.</p>";
    });
}