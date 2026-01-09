// public/js/script.js

document.addEventListener("DOMContentLoaded", () => {
  // --- 1. Geração de Estrelas e Scroll ---
  const starContainer = document.getElementById("star-container");
  if (starContainer) {
    for (let i = 0; i < 50; i++) {
      const star = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      star.setAttribute("viewBox", "0 0 24 24");
      star.classList.add("star");
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

  // Scroll suave para âncoras
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });

  // Animações no scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  });

  document.querySelectorAll(".hidden").forEach((el) => observer.observe(el));

  // --- 2. Navbar dinâmica e gestão de sessão ---
  const navContainer = document.getElementById("dynamic-nav");
  const path = window.location.pathname;

  // Se for página de login ou registo, mostra só botão voltar
  if (path.includes("login.html") || path.includes("registo.html")) {
    if (navContainer) {
      navContainer.innerHTML =
        '<a href="/" class="nav-item"><i class="fa-solid fa-arrow-left"></i> Voltar</a>';
    }
  } else {
    checkSession();
  }

  // --- 3. Validação de Registo ---
  const regForm = document.querySelector('form[action="/registo"]');
  if (regForm) {
    regForm.addEventListener("submit", function (e) {
      const inputs = regForm.querySelectorAll("input, select");
      let valid = true;
      inputs.forEach((input) => {
        if (!input.value) valid = false;
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

    // Botão Limpar
    const btnClear = document.getElementById("btn-limpar");
    if (btnClear) {
      btnClear.addEventListener("click", () => regForm.reset());
    }
  }

  // --- 4. Página Visualização (Exploradores) ---
  if (path.includes("visualizacao.html")) {
    loadUsers(observer);
  }

  // --- 5. Página Astronomia (Curiosidade Toggle) ---
  const btnFact = document.getElementById("toggle-fact");
  const factBox = document.getElementById("fact-box");
  if (btnFact && factBox) {
    btnFact.addEventListener("click", () => {
      const isHidden =
        factBox.style.display === "none" || factBox.style.display === "";
      factBox.style.display = isHidden ? "block" : "none";
      btnFact.textContent = isHidden
        ? "Esconder Curiosidade"
        : "Mostrar Curiosidade Extra";
    });
  }
});

// --- Funções Auxiliares ---

function checkSession() {
  fetch("/check-session")
    .then((res) => res.json())
    .then((data) => {
      const nav = document.getElementById("dynamic-nav");
      if (!nav) return;

      if (data.loggedin) {
        nav.innerHTML = `
          <a href="/" class="nav-item">Início</a>
          <a href="/astronomia.html" class="nav-item">Curiosidades</a>
          <a href="/visualizacao.html" class="nav-item">Tripulação</a>
          <a href="/logout" class="btn btn-outline" style="border-color: var(--accent-pink); color: var(--accent-pink);">Logout</a>
        `;
      } else {
        nav.innerHTML = `
          <span style="margin-right:15px; color:#aaa;" class="desktop-only">Não tens conta?</span>
          <a href="/registo.html" class="btn">Criar Conta</a>
          <a href="/login.html" class="btn btn-outline">Login</a>
        `;
      }
    });
}

function loadUsers(observer) {
  const grid = document.getElementById("user-grid-container");
  if (!grid) return;

  fetch("/getutilizadores")
    .then((res) => res.json())
    .then((users) => {
      if (users.length === 0) {
        grid.innerHTML = "<p>Nenhum explorador encontrado.</p>";
        return;
      }

      users.forEach((user) => {
        const imgPath = user.fotografia
          ? "/" + user.fotografia.replaceAll("\\", "/").replace(/^public\//, "")
          : "img/default.png";
        const cargo = user.cargo || "Recruta";
        const bio = user.biografia || "Sem dados biográficos.";
        const card = document.createElement("div");
        card.className = "crew-card hidden";
        card.innerHTML = `
          <div class="crew-badge">${cargo}</div>
          <div class="crew-avatar-container">
            <img src="${imgPath}" alt="${user.nome}" class="crew-avatar">
          </div>
          <h3 class="crew-name">${user.nome}</h3>
          <p style="color:var(--accent-pink); font-size:0.9rem;">${user.email}</p>
          <div class="crew-bio">"${bio}"</div>
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
