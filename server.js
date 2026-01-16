// server.js
const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const bcrypt = require("bcrypt");
const path = require("node:path");
const fs = require("node:fs");

const app = express();
const port = 3000;

// --- CONFIGURAÇÃO DA BASE DE DADOS ---
// Certifica-te que a password é a correta para o teu MySQL local
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "h4dk3M,^D0%hLy12}]",
  database: "astronomia_registos",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Conectado à Base de Dados MySQL!");
});

// --- MIDDLEWARE ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve ficheiros estáticos da pasta 'public' (CSS, JS, Imagens, HTML)
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: "segredo_cosmico_super_seguro",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

// --- CONFIGURAÇÃO DO MULTER (UPLOADS) ---
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
const isAuthenticated = (req, res, next) => {
  if (req.session.loggedin) {
    return next();
  }
  // Se não estiver logado, redireciona para a raiz (Login)
  res.redirect("/");
};

// ==========================================
//                ROTAS
// ==========================================

// 1. ROTA RAIZ (LOGIN) - ALTERADO
app.get("/", (req, res) => {
  // Se o utilizador já estiver logado, enviamos para o dashboard
  if (req.session.loggedin) {
    return res.redirect("/dashboard.html");
  }
  // Caso contrário, mostra o login (que deve ser o teu ficheiro index.html na pasta public)
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 2. DASHBOARD (ANTIGA LANDING PAGE) - NOVA ROTA
// Protegida pelo middleware 'isAuthenticated'
app.get("/dashboard.html", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "dashboard.html"));
});

// 3. PÁGINA DE REGISTO
app.get("/registo.html", (req, res) => {
  if (req.session.loggedin) {
    return res.redirect("/dashboard.html");
  }
  res.sendFile(path.join(__dirname, "public", "registo.html"));
});

// 4. VERIFICAR SESSÃO (API para o Frontend)
app.get("/check-session", (req, res) => {
  res.json({
    loggedin: req.session.loggedin || false,
    email: req.session.email || null, // <--- ADICIONA ESTA LINHA
  });
});

// 5. REGISTO (POST)
app.post(
  "/registo",
  upload.fields([{ name: "fotografia" }, { name: "documento" }]),
  async (req, res) => {
    const {
      nome,
      data_nascimento,
      morada,
      email,
      telefone,
      genero,
      password,
      biografia,
    } = req.body;

    // Atribuição de cargo aleatório (mantido do teu código original)
    const cargos = [
      "Cadete",
      "Engenheiro",
      "Piloto",
      "Cientista",
      "Comandante",
    ]; // [cite: 8]
    const cargoAtribuido = cargos[Math.floor(Math.random() * cargos.length)];

    const fotoPath = req.files["fotografia"]
      ? req.files["fotografia"][0].path
      : "uploads/default-avatar.png";
    const docPath = req.files["documento"]
      ? req.files["documento"][0].path
      : null;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      // Inserção na Base de Dados
      const query = `INSERT INTO utilizadores (nome, data_nascimento, morada, email, telefone, genero, fotografia, documento, password, cargo, biografia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      db.query(
        query,
        [
          nome,
          data_nascimento,
          morada,
          email,
          telefone,
          genero,
          fotoPath,
          docPath,
          hashedPassword,
          cargoAtribuido,
          biografia || "Novo explorador pronto para a missão.",
        ],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.send(
              '<script>alert("Erro no registo! O email pode já estar a ser usado."); window.location.href="/registo.html";</script>'
            );
          }
          // Login automático após registo
          req.session.loggedin = true;
          req.session.email = email;
          // ALTERADO: Redireciona para o dashboard em vez da raiz
          res.redirect("/dashboard.html");
        }
      );
    } catch (e) {
      console.log(e);
      res.redirect("/registo.html");
    }
  }
);

// 6. LOGIN (POST)
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  db.query(
    "SELECT * FROM utilizadores WHERE email = ?",
    [email],
    async (err, results) => {
      if (err) throw err;

      if (results.length > 0) {
        const comparison = await bcrypt.compare(password, results[0].password);
        if (comparison) {
          req.session.loggedin = true;
          req.session.email = email;
          // ALTERADO: Redireciona para o dashboard
          res.redirect("/dashboard.html");
        } else {
          res.send(
            '<script>alert("Password incorreta!"); window.location.href="/";</script>'
          );
        }
      } else {
        res.send(
          '<script>alert("Utilizador não encontrado!"); window.location.href="/";</script>'
        );
      }
    }
  );
});

// 7. LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/"); // Redireciona para o Login
});

// 8. API: DADOS DOS UTILIZADORES (Protegido)
app.get("/getutilizadores", isAuthenticated, (req, res) => {
  // ADICIONADO: 'documento' na lista de campos a selecionar
  db.query(
    "SELECT id, nome, data_nascimento, morada, email, telefone, genero, fotografia, documento, cargo, biografia FROM utilizadores",
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).send("Erro ao buscar tripulação.");
      }
      res.json(results);
    }
  );
});

// 9. OUTRAS PÁGINAS PROTEGIDAS
app.get("/tripulacao.html", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "tripulacao.html"));
});

app.get("/perfil.html", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "perfil.html"));
});

app.get("/explorar.html", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "explorar.html"));
});

// INICIAR SERVIDOR
// --- NOVO: ROTA PARA OBTER DADOS DO UTILIZADOR LOGADO (SEGURO) ---
app.get("/api/me", isAuthenticated, (req, res) => {
  const email = req.session.email;

  db.query(
    "SELECT * FROM utilizadores WHERE email = ?",
    [email],
    (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Erro ao buscar dados." });
      }
      if (results.length > 0) {
        // Removemos a password antes de enviar para o frontend por segurança
        const user = results[0];
        delete user.password;
        res.json(user);
      } else {
        res.status(404).json({ error: "Utilizador não encontrado." });
      }
    }
  );
});

// --- NOVO: ROTA PARA ATUALIZAR PERFIL ---
app.post(
  "/update-profile",
  isAuthenticated,
  upload.fields([{ name: "fotografia" }, { name: "documento" }]),
  async (req, res) => {
    const { nome, telefone, morada, biografia } = req.body;
    const email = req.session.email; // Usamos o email da sessão para garantir que alteramos o user certo

    // Lógica para manter a imagem antiga se não for feito upload de uma nova
    // Primeiro buscamos os dados atuais para saber os caminhos antigos
    db.query(
      "SELECT fotografia, documento FROM utilizadores WHERE email = ?",
      [email],
      (err, results) => {
        if (err) throw err;
        // 8. API: DADOS DOS UTILIZADORES
        const currentUser = results[0];

        // Se houver novo ficheiro, usa o novo path. Se não, mantém o antigo.
        const fotoPath = req.files["fotografia"]
          ? req.files["fotografia"][0].path
          : currentUser.fotografia;
        const docPath = req.files["documento"]
          ? req.files["documento"][0].path
          : currentUser.documento;

        const query = `
            UPDATE utilizadores 
            SET nome = ?, telefone = ?, morada = ?, biografia = ?, fotografia = ?, documento = ?
            WHERE email = ?
        `;

        db.query(
          query,
          [nome, telefone, morada, biografia, fotoPath, docPath, email],
          (err, result) => {
            if (err) {
              console.error(err);
              return res.send(
                '<script>alert("Erro ao atualizar."); window.location.href="/perfil.html";</script>'
              );
            }
            res.send(
              '<script>alert("Perfil atualizado com sucesso!"); window.location.href="/perfil.html";</script>'
            );
          }
        );
      }
    );
  }
);
app.listen(port, () => {
  console.log(`Servidor a rodar em http://localhost:${port}`);
});
