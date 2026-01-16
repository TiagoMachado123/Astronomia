let allCrewMembers = []; // Variável local ao módulo/ficheiro

document.addEventListener("DOMContentLoaded", () => {
    // Verifica se estamos na página de visualização
    const grid = document.getElementById("user-grid-container");
    if (!grid) return;

    // 1. Configurar Observer para animações dos cartões
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) entry.target.classList.add("show");
        });
    }, { threshold: 0.1 });

    // 2. Carregar dados
    loadUsers(grid, cardObserver);

    // 3. Configurar Botão de Limpar Filtros
    const btnClear = document.getElementById("btn-clear-filters");
    const searchInput = document.getElementById("crew-search");
    const roleFilter = document.getElementById("crew-role-filter");

    if (btnClear && searchInput && roleFilter) {
        btnClear.addEventListener("click", function () {
            searchInput.value = "";
            roleFilter.value = "";
            // Dispara eventos para atualizar a lista
            searchInput.dispatchEvent(new Event('input'));
            roleFilter.dispatchEvent(new Event('change'));
        });
    }
});

function loadUsers(grid, observer) {
    fetch("/getutilizadores")
        .then((res) => res.json())
        .then((users) => {
            allCrewMembers = users;
            renderGrid(allCrewMembers, grid, observer);
            setupFilters(grid, observer);
        })
        .catch((err) => {
            console.error(err);
            grid.innerHTML = `
        <div style="grid-column: 1/-1; text-align:center; padding: 60px; color: #aaa;">
          <i class="fa-solid fa-satellite-dish" style="font-size: 3rem; margin-bottom: 20px; display: block; color: var(--accent-pink);"></i>
          <p style="font-size: 1.2rem;">Erro ao estabelecer comunicação com a base de dados.</p>
        </div>`;
        });
}

function setupFilters(grid, observer) {
    const searchInput = document.getElementById("crew-search");
    const roleFilter = document.getElementById("crew-role-filter");
    const countNumber = document.getElementById("results-count-number");

    const filterFunction = () => {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const selectedRole = roleFilter.value;

        const filteredUsers = allCrewMembers.filter(user => {
            const nameMatch = user.nome.toLowerCase().includes(searchTerm);
            const roleMatch = selectedRole === "" || (user.cargo && user.cargo.includes(selectedRole));
            return nameMatch && roleMatch;
        });

        renderGrid(filteredUsers, grid, observer);
    };

    if (searchInput) searchInput.addEventListener("input", filterFunction);
    if (roleFilter) roleFilter.addEventListener("change", filterFunction);
}

function renderGrid(users, grid, observer) {
    grid.innerHTML = "";

    // Atualizar contador de resultados
    const resultsInfo = document.getElementById("results-info");
    const countNumber = document.getElementById("results-count-number");

    if (resultsInfo) resultsInfo.style.display = "flex";
    if (countNumber) countNumber.textContent = users.length;

    if (users.length === 0) {
        grid.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 60px; color: #aaa;">
        <i class="fa-solid fa-user-slash" style="font-size: 3rem; margin-bottom: 20px; display: block; color: var(--accent-pink);"></i>
        <p style="font-size: 1.2rem;">Nenhum tripulante encontrado</p>
      </div>`;
        return;
    }

    users.forEach((user, index) => {
        const imgPath = user.fotografia
            ? "/" + user.fotografia.replaceAll("\\", "/").replace(/^public\//, "")
            : "img/default.png";
        const cargo = user.cargo || "Cadete Espacial";
        const bio = user.biografia || "Novo explorador pronto para a missão.";

        // Usa função do utils.js
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