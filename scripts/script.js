function validarForm() {
  const form = document.getElementById("registoForm");
  const email = form.email.value;
  const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!form.nome.value || !form.data_nascimento.value || !form.morada.value || !form.email.value || !form.telefone.value || !form.genero.value || !form.fotografia.value || !form.documento.value || !form.password.value) {
    alert("Todos os campos são obrigatórios!");
    return false;
  }
  if (!regexEmail.test(email)) {
    alert("Email inválido!");
    return false;
  }
  return true;
}

function limparForm() {
  document.getElementById("registoForm").reset();
}

function carregarUtilizadores() {
  fetch("/getutilizadores")
    .then(response => response.json())
    .then(data => {
      let html = "";
      data.forEach(user => {
        html += `<p>Nome: ${user.nome}<br>Data Nascimento: ${user.data_nascimento}<br>Morada: ${user.morada}<br>Email: ${user.email}<br>Telefone: ${user.telefone}<br>Género: ${user.genero}<br>Fotografia: <img src="${user.fotografia}" width="100"><br>Documento: <img src="${user.documento}" width="100"><br></p><hr>`;
      });
      document.getElementById("dados").innerHTML = html;
    })
    .catch(err => console.error(err));
}

function mostrarFacto() {
  const div = document.getElementById("factoExtra");
  if (div.style.display === "none") {
    div.style.display = "block";
  } else {
    div.style.display = "none";
  }
}