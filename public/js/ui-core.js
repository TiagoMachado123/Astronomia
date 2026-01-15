// --- /js/ui-core.js ---
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;

  // Lista de páginas públicas que NÃO precisam de verificação
  const publicPages = ["/", "/index.html", "/login.html", "/registo.html"];

  // Se a página atual NÃO for pública, verifica a sessão
  if (!publicPages.includes(path)) {
    fetch("/check-session")
      .then((res) => res.json())
      .then((data) => {
        if (!data.loggedin) {
          // Se o servidor disser que não está logado, expulsa para o login
          window.location.href = "/";
        }
      })
      .catch(() => {
        // Se houver erro de rede, assume logout por segurança
        window.location.href = "/";
      });
  }

  // --- 1. INJETAR HEADER E NAVBAR ---
  if (
    path !== "/" &&
    !path.includes("index.html") &&
    !path.includes("login.html")
  ) {
    injectHeader();
    setupDynamicNav(path);
    setupDropdownLogic();
  }

  // --- 2. GERAÇÃO DE ESTRELAS ---
  const starContainer = document.getElementById("star-container");
  if (starContainer) {
    for (let i = 0; i < 60; i++) {
      const star = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      star.setAttribute("viewBox", "0 0 24 24");
      star.classList.add("star");

      // Posição e Tamanho aleatórios
      star.style.left = Math.random() * 100 + "vw";
      star.style.top = Math.random() * 100 + "vh";
      const size = Math.random() * 15 + 5;
      star.style.width = size + "px";
      star.style.height = size + "px";
      star.style.setProperty("--duration", Math.random() * 3 + 2 + "s");

      star.innerHTML =
        '<path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/>';
      starContainer.appendChild(star);
    }
  }

  // --- 3. SMOOTH SCROLL ---
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });

  // --- 4. ANIMAÇÕES (OBSERVER) ---
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("show");
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll(".hidden").forEach((el) => observer.observe(el));
});

// --- FUNÇÕES DE UI ---

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

function setupDynamicNav(path) {
  const navContainer = document.getElementById("dynamic-nav");
  if (!navContainer) return;

  if (path.includes("registo.html")) {
    navContainer.innerHTML = `
            <a href="/" class="nav-item">
                <i class="fa-solid fa-arrow-left"></i> Voltar ao Login
            </a>`;
  } else {
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
                     <i class="fa-solid fa-user-astronaut"></i>
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
}

function setupDropdownLogic() {
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
