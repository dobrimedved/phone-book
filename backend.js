const http = require("http");
const url = require("url");
const sqlite3 = require("sqlite3").verbose();

const hostname = "127.0.0.1";
const port = 3000;

const fetchAll = async (db, sql, params) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      resolve(rows);
    });
  });
};

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const db = new sqlite3.Database("./db.sqlite3");

  if (req.method === "GET" && pathname === "/users") {
    db.all("SELECT * FROM users", [], (err, rows) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ users: rows }));
    });
  } else if (req.method === "GET" && pathname === "/contacts") {
    db.all("SELECT * FROM contacts", [], (err, rows) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ contacts: rows }));
    });
  } else if (req.method === "POST" && pathname === "/contacts") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const data = JSON.parse(body);
      console.log(data);

      const sql = `
                INSERT INTO contacts
                (lastName, firstName, middleName, groupItem, phone, email, address, fullName, userId)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

      db.run(
        sql,
        [
          data.lastName,
          data.firstName,
          data.middleName,
          data.groupItem,
          data.phone,
          data.email,
          data.address,
          data.fullName,
          String(data.userId),
        ],
        function (err) {
          if (err) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ id: this.lastID, ...data.name }));
        }
      );
    });
  } else if (req.method === "POST" && pathname === "/users") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const { id, name } = JSON.parse(body);
      db.run(
        "INSERT INTO user (id, name) VALUES (?, ?)",
        [id, name],
        function (err) {
          if (err) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: err.message }));
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ id: this.lastID, name }));
        }
      );
    });
  } else if (req.method === "DELETE" && pathname === "/contacts") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk.toString();
    });

    req.on("end", () => {
      const params = url.parse(req.url, true).query;
      console.log(params.id)
      db.run("DELETE FROM contacts where id=?", [params.id], function (err) {
        if (err) {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: err.message }));
          return;
        }
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "success" }));
      });
    });
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not Found" }));
  }
});

server.listen(port, hostname, () => {
  console.log(`Server running at http://${hostname}:${port}/`);
});
