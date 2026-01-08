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

// Configuração da Base de Dados
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

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use(
  session({
    secret: "segredo_cosmico_super_seguro",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // 'true' apenas se usar HTTPS
  })
);

// Configuração do Multer (Uploads)
// Verifica se a pasta existe
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

// Middleware de Autenticação
const isAuthenticated = (req, res, next) => {
  if (req.session.loggedin) {
    return next();
  }
  res.redirect("/login.html");
};

// --- ROTAS ---

// Rota Raiz (Landing Page)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "landing.html"));
});

// Endpoint para verificar sessão (para o Frontend JS atualizar a Nav)
app.get("/check-session", (req, res) => {
  res.json({ loggedin: req.session.loggedin || false });
});

// Registo (POST)
app.post(
  "/registo",
  upload.fields([{ name: "fotografia" }, { name: "documento" }]),
  async (req, res) => {
    const { nome, data_nascimento, morada, email, telefone, genero, password } =
      req.body;

    // Caminhos dos ficheiros
    const fotoPath = req.files["fotografia"]
      ? req.files["fotografia"][0].path
      : null;
    const docPath = req.files["documento"]
      ? req.files["documento"][0].path
      : null;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const query = `INSERT INTO utilizadores (nome, data_nascimento, morada, email, telefone, genero, fotografia, documento, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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
        ],
        (err, result) => {
          if (err) {
            console.error(err);
            return res.send(
              '<script>alert("Erro no registo! Email pode já existir."); window.location.href="/registo.html";</script>'
            );
          }
          req.session.loggedin = true;
          req.session.email = email;
          res.redirect("/");
        }
      );
    } catch (e) {
      console.log(e);
      res.redirect("/registo.html");
    }
  }
);

// Login (POST)
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
          res.redirect("/");
        } else {
          res.send(
            '<script>alert("Password incorreta!"); window.location.href="/login.html";</script>'
          );
        }
      } else {
        res.send(
          '<script>alert("Utilizador não encontrado!"); window.location.href="/login.html";</script>'
        );
      }
    }
  );
});

// Logout
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// Visualizar Dados (Protegido) - Retorna JSON
app.get("/getutilizadores", isAuthenticated, (req, res) => {
  db.query(
    "SELECT id, nome, data_nascimento, morada, email, telefone, genero, fotografia FROM utilizadores",
    (err, results) => {
      if (err) throw err;
      res.json(results);
    }
  );
});

// Rotas para páginas protegidas (HTML diretos)
app.get("/visualizacao.html", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "visualizacao.html"));
});

app.get("/astronomia.html", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "astronomia.html"));
});

app.listen(port, () => {
  console.log(`Servidor a rodar em http://localhost:${port}`);
});
