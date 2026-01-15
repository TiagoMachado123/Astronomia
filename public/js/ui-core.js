/* --- /public/js/ui-core.js --- */

document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  // --- 1. VERIFICAÇÃO DE SESSÃO (Segurança) ---
  const publicPages = ["/", "/index.html", "/login.html", "/registo.html"];

  if (!publicPages.includes(path)) {
    fetch("/check-session")
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedin) {
          window.location.href = "/";
        }
      })
      .catch(() => {
        window.location.href = "/";
      });
  }

  // --- 2. INJEÇÃO DE ESTRUTURA (Header/Nav) ---
  // Apenas injeta se não estiver nas páginas de login/registo
  if (
    path !== "/" &&
    !path.includes("index.html") &&
    !path.includes("login.html") &&
    !path.includes("registo.html")
  ) {
    injectNavbar(); // Cria a <nav>
    setupDynamicNav(path); // Preenche os links
    setupDropdownLogic(); // Ativa o menu do user
    initMobileMenu(); // Ativa o menu mobile
    initNavbarScroll(); // Ativa o efeito de scroll
  }
  // Caso especial para página de registo (apenas botão voltar)
  else if (path.includes("registo.html")) {
    // Opcional: Injetar um header simples ou deixar o HTML tratar disso
  }

  // --- 3. INICIAR EFEITOS VISUAIS ---
  initStars(); // Estrelas e Cometas
  initObservers(); // Animações de scroll
  initSmoothScroll(); // Links âncora
});

/* =========================================
   FUNÇÕES DE UI E LÓGICA
   ========================================= */

// --- A. INJEÇÃO DA NAVBAR ---
function injectNavbar() {
  // Cria o elemento <nav> em vez de <header> para bater certo com o CSS novo
  const nav = document.createElement("nav");
  nav.id = "main-navbar"; // ID para referência

  nav.innerHTML = `
      <div class="container nav-wrapper">
        <a href="/dashboard.html" class="logo">
          <i class="fa-solid fa-rocket"></i> Astronomia Explorer
        </a>
        
        <button class="mobile-menu-btn" id="mobileMenuBtn">
            <i class="fa-solid fa-bars"></i>
        </button>

        <div id="dynamic-nav" class="nav-links"></div>
      </div>
    `;

  // Insere no topo do body
  document.body.prepend(nav);
}

// --- B. LINKS DINÂMICOS & PERFIL ---
function setupDynamicNav(path) {
  const navContainer = document.getElementById("dynamic-nav");
  if (!navContainer) return;

  const isActive = (p) => (path.includes(p) ? "active" : "");

  navContainer.innerHTML = `
      <a href="/dashboard.html" class="nav-item ${isActive(
        "dashboard.html"
      )}">Início</a>
      <a href="/astronomia.html" class="nav-item ${isActive(
        "astronomia.html"
      )}">Curiosidades</a>
      <a href="/visualizacao.html" class="nav-item ${isActive(
        "visualizacao.html"
      )}">Tripulação</a>
      
      <div class="user-menu-container">
          <div class="user-avatar-btn" id="profile-trigger">
               <img src="https://ui-avatars.com/api/?name=User&background=random" alt="User">
          </div>
          
          <div class="profile-dropdown" id="profile-dropdown">
              <a href="/perfil.html" class="${isActive("perfil.html")}">
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

// --- C. EFEITOS VISUAIS (ESTRELAS & COMETAS) ---
function initStars() {
  const container = document.getElementById("star-container");
  if (!container) return; // Se não houver container no HTML, sai.

  // 1. Estrelas Estáticas
  const starCount = 150;
  for (let i = 0; i < starCount; i++) {
    const star = document.createElement("div");
    star.className = "star";
    // Posição aleatória
    star.style.left = Math.random() * 100 + "%";
    star.style.top = Math.random() * 100 + "%";
    // Tamanho aleatório
    const size = Math.random() * 3 + 1;
    star.style.width = size + "px";
    star.style.height = size + "px";
    // Duração da animação aleatória
    star.style.setProperty("--duration", Math.random() * 3 + 2 + "s");
    container.appendChild(star);
  }

  // 2. Cometas / Estrelas Cadentes
  for (let i = 0; i < 3; i++) {
    const shootingStar = document.createElement("div");
    shootingStar.className = "shooting-star";
    // Começam mais à direita para cruzar a tela
    shootingStar.style.left = Math.random() * 50 + 50 + "%";
    shootingStar.style.top = Math.random() * 30 + "%";
    shootingStar.style.animationDelay = Math.random() * 10 + i * 5 + "s";
    container.appendChild(shootingStar);
  }
}

// --- D. INTERATIVIDADE ---

function setupDropdownLogic() {
  // Pequeno timeout para garantir que o DOM foi injetado
  setTimeout(() => {
    const trigger = document.getElementById("profile-trigger");
    const dropdown = document.getElementById("profile-dropdown");
    if (trigger && dropdown) {
      trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        dropdown.classList.toggle("active");
      });
      document.addEventListener("click", (e) => {
        if (!dropdown.contains(e.target) && !trigger.contains(e.target)) {
          dropdown.classList.remove("active");
        }
      });
    }
  }, 100);
}

function initMobileMenu() {
  // Timeout para esperar a injeção da navbar
  setTimeout(() => {
    const btn = document.getElementById("mobileMenuBtn");
    const links = document.getElementById("dynamic-nav"); // O container dos links

    if (btn && links) {
      btn.addEventListener("click", () => {
        links.classList.toggle("active"); // O CSS usa .active para mostrar o menu mobile
      });
    }
  }, 100);
}

function initNavbarScroll() {
  window.addEventListener("scroll", () => {
    const navbar = document.querySelector("nav");
    if (navbar) {
      if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    }
  });
}

function initObservers() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("show");
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".hidden").forEach((el) => observer.observe(el));
}

function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });
}
