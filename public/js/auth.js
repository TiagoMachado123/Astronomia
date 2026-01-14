document.addEventListener("DOMContentLoaded", () => {
    const regForm = document.querySelector('form[action="/registo"]');

    // Se não houver formulário de registo, não executa o resto (ex: página de login)
    if (!regForm) return;

    // --- 1. MÁSCARA E VALIDAÇÃO DE TELEFONE (EM TEMPO REAL) ---
    const phoneInput = regForm.querySelector('input[name="telefone"]');
    if (phoneInput) {
        phoneInput.addEventListener("input", (e) => {
            let value = e.target.value;

            // Apenas permite números (remove tudo o que não for 0-9)
            value = value.replace(/\D/g, "");

            // Limita a 9 dígitos (padrão português)
            if (value.length > 9) {
                value = value.slice(0, 9);
            }

            // Adiciona os hífenes (xxx-xxx-xxx)
            // A lógica: Captura grupos e volta a montar a string
            if (value.length > 6) {
                value = value.replace(/^(\d{3})(\d{3})(\d+)/, "$1-$2-$3");
            } else if (value.length > 3) {
                value = value.replace(/^(\d{3})(\d+)/, "$1-$2");
            }

            // Atualiza o valor no campo
            e.target.value = value;
        });
    }

    // --- 2. RESTRIÇÃO DE DATA (NÃO PERMITIR FUTURO) ---
    const dateInput = regForm.querySelector('input[name="data_nascimento"]');
    if (dateInput) {
        const today = new Date().toISOString().split("T")[0];
        dateInput.setAttribute("max", today); // Define o max no HTML5

        dateInput.addEventListener("change", function () {
            if (this.value > today) {
                alert("A data de nascimento não pode ser no futuro, viajante do tempo!");
                this.value = "";
            }
        });
    }

    // --- 3. VALIDAÇÃO DE TAMANHO DE FICHEIROS (Max 5MB) ---
    const fileInputs = regForm.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
        input.addEventListener("change", function () {
            if (this.files && this.files[0]) {
                const fileSize = this.files[0].size / 1024 / 1024; // em MB
                if (fileSize > 5) {
                    alert("O ficheiro é demasiado grande! O limite máximo é 5MB.");
                    this.value = ""; // Limpa o input
                }
            }
        });
    });

    // --- 4. VALIDAÇÃO AO SUBMETER (SUBMIT) ---
    regForm.addEventListener("submit", function (e) {
        const inputs = regForm.querySelectorAll("input, select");
        let valid = true;
        let errorMessage = "";

        // Validação Genérica de Campos Vazios
        inputs.forEach((input) => {
            if (input.hasAttribute("required") && !input.value) {
                valid = false;
                input.classList.add("error-border"); // Podes criar esta classe no CSS para ficar vermelho
            } else {
                input.classList.remove("error-border");
            }
        });

        if (!valid) {
            errorMessage = "Por favor, preenche todos os campos obrigatórios.";
        }

        // Validação Específica de Email (Mais robusta)
        // Regex explica: texto + @ + texto + . + letras (mínimo 2)
        const email = regForm.querySelector('input[name="email"]').value;
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

        if (valid && !emailRegex.test(email)) {
            valid = false;
            errorMessage = "O email introduzido é inválido. Verifica se tem '@' e um ponto '.' válido (ex: .com, .pt).";
        }

        // Validação Final de Telefone (Tem de ter 9 digitos, ignorando os hifenes)
        const phoneVal = phoneInput.value.replace(/\D/g, "");
        if (valid && phoneVal.length !== 9) {
            valid = false;
            errorMessage = "O número de telefone deve ter exatamente 9 dígitos.";
        }

        // Validação de Password (Mínimo 8 chars e pelo menos 1 número)
        const password = regForm.querySelector('input[name="password"]').value;
        const hasNumber = /\d/;

        if (valid && (password.length < 8 || !hasNumber.test(password))) {
            valid = false;
            errorMessage = "A password deve ter pelo menos 8 caracteres e incluir um número.";
        }

        // Se algo falhou, impede o envio
        if (!valid) {
            e.preventDefault();
            alert(errorMessage || "Existem erros no formulário.");
        }
    });

    // Botão de Limpar
    const btnClear = document.getElementById("btn-limpar");
    if (btnClear) {
        btnClear.addEventListener("click", () => {
            regForm.reset();
            // Remove estilos de erro se existirem
            regForm.querySelectorAll(".error-border").forEach(el => el.classList.remove("error-border"));
        });
    }
});