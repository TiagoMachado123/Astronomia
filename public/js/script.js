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
      // Estilos random
      star.style.left = Math.random() * 100 + "vw";
      star.style.top = Math.random() * 100 + "vh";
      const size = Math.random() * 15 + 5;
      star.style.width = size + "px";
      star.style.height = size + "px";
      star.style.setProperty("--duration", Math.random() * 3 + 2 + "s");

      // Path da estrela (simples)
      star.innerHTML =
        '<path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6-4.8-6 4.8 2.4-7.2-6-4.8h7.6z"/>';
      starContainer.appendChild(star);
    }
  }

  // Smooth Scroll
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) target.scrollIntoView({ behavior: "smooth" });
    });
  });

  // Animação ao scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) entry.target.classList.add("show");
    });
  });
  document.querySelectorAll(".hidden").forEach((el) => observer.observe(el));

  // --- 2. Gestão de Sessão (Navbar) ---
  fetch("/check-session")
    .then((res) => res.json())
    .then((data) => {
      const nav = document.getElementById("dynamic-nav");
      if (nav) {
        if (data.loggedin) {
          nav.innerHTML = `
                        <a href="/visualizacao.html">Exploradores</a>
                        <a href="/astronomia.html">Curiosidades</a>
                        <a href="/logout" class="btn btn-outline" style="border-color: var(--accent-pink); color: var(--accent-pink);">Logout</a>
                    `;
        } else {
          nav.innerHTML = `
                        <span style="margin-right:15px; color:#aaa;" class="desktop-only">Não tens conta?</span>
                        <a href="/registo.html" class="btn">Criar Conta</a>
                        <a href="/login.html" class="btn btn-outline">Login</a>
                    `;
        }
      }
    });

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

  // --- 4. Página Visualização (Fetch) ---
  if (globalThis.location.pathname.includes("visualizacao.html")) {
    fetch("/getutilizadores")
      .then((res) => res.json())
      .then((users) => {
        const grid = document.getElementById("user-grid-container");
        if (users.length === 0) {
          grid.innerHTML = "<p>Ainda não há exploradores registados.</p>";
          return;
        }
        users.forEach((user) => {
          const imgUrl = user.fotografia
            ? "/" + user.fotografia.replaceAll("\\", "/")
            : "https://via.placeholder.com/100?text=Alien";
          const card = document.createElement("div");
          card.className = "user-card hidden";
          card.innerHTML = `
                        <img src="${imgUrl}" class="user-avatar" alt="${user.nome}">
                        <h3>${user.nome}</h3>
                        <p style="color:#aaa; font-size:0.9rem;">${user.email}</p>
                        <p>Planeta: ${user.morada}</p>
                    `;
          grid.appendChild(card);
          observer.observe(card); // Animação
        });
      });
  }

  // --- 5. Página Astronomia (Fact Toggle) ---
  const btnFact = document.getElementById("toggle-fact");
  const factBox = document.getElementById("fact-box");
  if (btnFact && factBox) {
    btnFact.addEventListener("click", () => {
      if (factBox.style.display === "none" || factBox.style.display === "") {
        factBox.style.display = "block";
        btnFact.textContent = "Esconder Curiosidade";
      } else {
        factBox.style.display = "none";
        btnFact.textContent = "Mostrar Curiosidade Extra";
      }
    });
  }
});
