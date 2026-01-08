const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const session = require("express-session");
const multer = require("multer");
const bcrypt = require("bcrypt");
const path = require("node:path");
const fs = require("fs");

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname)); // Serve ficheiros estáticos como HTML

// Sessões (simples, para confirmar registo)
app.use(
  session({
    secret: "astronomia_secreto",
    resave: false,
    saveUninitialized: true,
  })
);

// Config multer para uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });

// Liga à DB
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "h4dk3M,^D0%hLy12}]", // Muda para a tua password
  database: "astronomia_registos",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to database");
});

// Rota GET para página inicial
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Rota POST para registo
app.post("/registo", upload.fields([{ name: "fotografia" }, { name: "documento" }]), async (req, res) => {
  const { nome, data_nascimento, morada, email, telefone, genero, password } = req.body;
  const fotografia = req.files["fotografia"] ? req.files["fotografia"][0].path : null;
  const documento = req.files["documento"] ? req.files["documento"][0].path : null;

  // Cifra password
  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = "INSERT INTO utilizadores (nome, data_nascimento, morada, email, telefone, genero, fotografia, documento, password) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  db.query(sql, [nome, data_nascimento, morada, email, telefone, genero, fotografia, documento, hashedPassword], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Erro ao registar");
    }
    req.session.registado = true;
    res.redirect("/visualizacao.html");
  });
});

// Rota GET para dados JSON (para visualização)
app.get("/getutilizadores", (req, res) => {
  db.query("SELECT * FROM utilizadores", (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Servidor
app.listen(3000, () => {
  console.log("Server running on port 3000 http://localhost:3000");
});