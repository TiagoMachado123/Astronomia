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
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "h4dk3M,^D0%hLy12}]", // Confirma se esta é a password correta
  database: "astronomia_registos",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Conectado à Base de Dados MySQL!");
});

// --- MIDDLEWARE ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve ficheiros estáticos da pasta 'public' e 'uploads'
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
    // Limpar nome do ficheiro para evitar caracteres estranhos
    const cleanName = file.originalname.replace(/[^a-zA-Z0-9.]/g, "_");
    cb(null, Date.now() + "-" + cleanName);
  },
});
const upload = multer({ storage: storage });

// --- MIDDLEWARE DE AUTENTICAÇÃO ---
const isAuthenticated = (req, res, next) => {
  if (req.session.loggedin) {
    return next();
  }
  res.redirect("/");
};

// ==========================================
//                ROTAS BASE
// ==========================================

// 1. ROTA RAIZ (LOGIN)
app.get("/", (req, res) => {
  if (req.session.loggedin) {
    return res.redirect("/dashboard.html");
  }
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// 2. DASHBOARD
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

// 4. VERIFICAR SESSÃO (API)
app.get("/check-session", (req, res) => {
  res.json({
    loggedin: req.session.loggedin || false,
    email: req.session.email || null,
  });
});

// 5. REGISTO (POST)
app.post(
  "/registo",
  upload.fields([{ name: "fotografia" }, { name: "documento" }]),
  async (req, res) => {
    const { nome, data_nascimento, morada, email, telefone, genero, password, biografia } = req.body;

    const cargos = ["Cadete", "Engenheiro", "Piloto", "Cientista", "Comandante"];
    const cargoAtribuido = cargos[Math.floor(Math.random() * cargos.length)];

    const fotoPath = req.files["fotografia"] ? req.files["fotografia"][0].path : "uploads/default-avatar.png";
    const docPath = req.files["documento"] ? req.files["documento"][0].path : null;

    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const query = `INSERT INTO utilizadores (nome, data_nascimento, morada, email, telefone, genero, fotografia, documento, password, cargo, biografia) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

      db.query(query, [nome, data_nascimento, morada, email, telefone, genero, fotoPath, docPath, hashedPassword, cargoAtribuido, biografia || "Novo explorador."], (err, result) => {
        if (err) {
          console.error(err);
          return res.send('<script>alert("Erro no registo! Email já utilizado."); window.location.href="/registo.html";</script>');
        }
        req.session.loggedin = true;
        req.session.email = email;
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

  db.query("SELECT * FROM utilizadores WHERE email = ?", [email], async (err, results) => {
    if (err) throw err;

    if (results.length > 0) {
      const comparison = await bcrypt.compare(password, results[0].password);
      if (comparison) {
        req.session.loggedin = true;
        req.session.email = email;
        res.redirect("/dashboard.html");
      } else {
        res.send('<script>alert("Password incorreta!"); window.location.href="/";</script>');
      }
    } else {
      res.send('<script>alert("Utilizador não encontrado!"); window.location.href="/";</script>');
    }
  });
});

// 7. LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy();
  res.redirect("/");
});

// ==========================================
//           PÁGINAS PRIVADAS & API
// ==========================================

app.get("/tripulacao.html", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "tripulacao.html"));
});

app.get("/perfil.html", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "perfil.html"));
});

app.get("/comunidade.html", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, "private", "comunidade.html"));
});

// API: DADOS DOS UTILIZADORES
app.get("/getutilizadores", isAuthenticated, (req, res) => {
  db.query("SELECT id, nome, data_nascimento, morada, email, telefone, genero, fotografia, documento, cargo, biografia FROM utilizadores", (err, results) => {
    if (err) return res.status(500).send("Erro ao buscar tripulação.");
    res.json(results);
  }
  );
});

// API: MEUS DADOS
app.get("/api/me", isAuthenticated, (req, res) => {
  const email = req.session.email;
  db.query("SELECT * FROM utilizadores WHERE email = ?", [email], (err, results) => {
    if (err) return res.status(500).json({ error: "Erro ao buscar dados." });
    if (results.length > 0) {
      const user = results[0];
      delete user.password;
      res.json(user);
    } else {
      res.status(404).json({ error: "Utilizador não encontrado." });
    }
  });
});

// API: ATUALIZAR PERFIL
app.post("/update-profile", isAuthenticated, upload.fields([{ name: "fotografia" }, { name: "documento" }]), (req, res) => {
  const { nome, telefone, morada, biografia } = req.body;
  const email = req.session.email;

  db.query("SELECT fotografia, documento FROM utilizadores WHERE email = ?", [email], (err, results) => {
    if (err) throw err;
    const currentUser = results[0];
    const fotoPath = req.files["fotografia"] ? req.files["fotografia"][0].path : currentUser.fotografia;
    const docPath = req.files["documento"] ? req.files["documento"][0].path : currentUser.documento;

    const query = `UPDATE utilizadores SET nome = ?, telefone = ?, morada = ?, biografia = ?, fotografia = ?, documento = ? WHERE email = ?`;
    db.query(query, [nome, telefone, morada, biografia, fotoPath, docPath, email], (err, result) => {
      if (err) return res.send('<script>alert("Erro ao atualizar."); window.location.href="/perfil.html";</script>');
      res.send('<script>alert("Perfil atualizado!"); window.location.href="/perfil.html";</script>');
    }
    );
  });
}
);

// ==========================================
//      API DA COMUNIDADE (INTEGRADA)
// ==========================================

// 1. OBTER POSTS (Com Filtros: All, Mine, Liked)
app.get('/api/posts', isAuthenticated, (req, res) => {
  const userEmail = req.session.email;
  const filter = req.query.filter; // 'all', 'mine', 'liked'

  // Passo 1: Obter ID do utilizador logado através do email
  db.query("SELECT id FROM utilizadores WHERE email = ?", [userEmail], (err, userResult) => {
    if (err || userResult.length === 0) return res.status(500).json({ error: "Erro interno user" });

    const userId = userResult[0].id;
    let params = [userId, userId]; // Para os subqueries de likes e is_author

    // Query Base (Mantendo aliases para compatibilidade com o frontend)
    let sql = `
            SELECT 
                p.id, p.titulo, p.conteudo, p.categoria, p.imagem, p.data_criacao, p.autor_id,
                u.nome AS autor_nome,
                u.cargo AS autor_cargo,
                u.fotografia AS autor_foto,
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes,
                (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id AND user_id = ?) as user_liked,
                (p.autor_id = ?) as is_author
            FROM posts p
            JOIN utilizadores u ON p.autor_id = u.id
        `;

    // Aplicar Filtros
    if (filter === 'mine') {
      sql += ` WHERE p.autor_id = ?`;
      params.push(userId);
    } else if (filter === 'liked') {
      sql += ` JOIN post_likes pl ON p.id = pl.post_id WHERE pl.user_id = ?`;
      params.push(userId);
    }

    sql += ` ORDER BY p.data_criacao DESC`;

    db.query(sql, params, (err, results) => {
      if (err) {
        console.error("Erro ao buscar posts:", err);
        return res.status(500).json({ error: "Erro interno SQL" });
      }
      // Converter user_liked e is_author para booleanos reais para o JS
      const posts = results.map(post => ({
        ...post,
        user_liked: post.user_liked > 0,
        is_author: post.is_author > 0
      }));
      res.json(posts);
    });
  });
});

// 2. CRIAR POST
app.post('/api/posts', isAuthenticated, upload.single("imagem"), (req, res) => {
  const { titulo, conteudo, categoria } = req.body;
  const userEmail = req.session.email;
  const imagemPath = req.file ? req.file.path : (req.body.imagem_url || null); // Suporte para upload ou URL

  if (!titulo || !conteudo) return res.status(400).json({ error: "Dados em falta" });

  db.query("SELECT id FROM utilizadores WHERE email = ?", [userEmail], (err, userResult) => {
    if (err || userResult.length === 0) return res.status(500).json({ error: "Erro user" });

    const autorId = userResult[0].id;
    const sql = "INSERT INTO posts (titulo, conteudo, categoria, imagem, autor_id, data_criacao) VALUES (?, ?, ?, ?, ?, NOW())";

    db.query(sql, [titulo, conteudo, categoria || 'discussao', imagemPath, autorId], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: "Erro ao criar post" });
      }
      res.json({ message: "Post criado", id: result.insertId });
    });
  });
});

// 3. ELIMINAR POST
app.delete('/api/posts/:id', isAuthenticated, (req, res) => {
  const postId = req.params.id;
  const userEmail = req.session.email;

  db.query("SELECT id FROM utilizadores WHERE email = ?", [userEmail], (err, userResult) => {
    if (err || userResult.length === 0) return res.status(500).json({ error: "Erro user" });
    const userId = userResult[0].id;

    // Verificar se é o autor
    db.query("SELECT * FROM posts WHERE id = ? AND autor_id = ?", [postId, userId], (err, posts) => {
      if (err || posts.length === 0) return res.status(403).json({ error: "Não autorizado" });

      // Apagar Likes primeiro (Integridade)
      db.query("DELETE FROM post_likes WHERE post_id = ?", [postId], (err) => {
        // Apagar Post
        db.query("DELETE FROM posts WHERE id = ?", [postId], (err) => {
          if (err) return res.status(500).json({ error: "Erro ao apagar" });
          res.json({ success: true, message: "Post eliminado" });
        });
      });
    });
  });
});

// 4. TOGGLE LIKE (Dar/Tirar Gosto)
app.post('/api/posts/:id/like', isAuthenticated, (req, res) => {
  const postId = req.params.id;
  const userEmail = req.session.email;

  db.query("SELECT id FROM utilizadores WHERE email = ?", [userEmail], (err, userResult) => {
    if (err || userResult.length === 0) return res.status(500).json({ error: "Erro user" });
    const userId = userResult[0].id;

    // Verifica se já deu like
    db.query("SELECT * FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, userId], (err, likes) => {
      if (err) return res.status(500).json({ error: "Erro DB" });

      if (likes.length > 0) {
        // Remover Like
        db.query("DELETE FROM post_likes WHERE post_id = ? AND user_id = ?", [postId, userId], (err) => {
          if (err) return res.status(500).json({ error: "Erro delete" });

          // Retornar nova contagem
          db.query("SELECT COUNT(*) as total FROM post_likes WHERE post_id = ?", [postId], (err, count) => {
            res.json({ liked: false, totalLikes: count[0].total });
          });
        });
      } else {
        // Adicionar Like
        db.query("INSERT INTO post_likes (post_id, user_id, data_like) VALUES (?, ?, NOW())", [postId, userId], (err) => {
          if (err) return res.status(500).json({ error: "Erro insert" });

          // Retornar nova contagem
          db.query("SELECT COUNT(*) as total FROM post_likes WHERE post_id = ?", [postId], (err, count) => {
            res.json({ liked: true, totalLikes: count[0].total });
          });
        });
      }
    });
  });
});

// INICIAR SERVIDOR
app.listen(port, () => {
  console.log(`Servidor a rodar em http://localhost:${port}`);
});