const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const bodyParser = require("body-parser");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));
app.use(bodyParser.json());

const PORT = 3000;

const users = [
  { username: "admin", password: "123", role: "admin" },
  { username: "operator", password: "123", role: "operator" }
];

let robots = [
  { id: 1, name: "Robot A1", status: "active", battery: 90 },
  { id: 2, name: "Robot B2", status: "idle", battery: 70 },
  { id: 3, name: "Robot C3", status: "error", battery: 40 }
];

let systemStopped = false;

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ error: "Ошибка" });
  res.json({ username: user.username, role: user.role });
});

app.post("/api/stop", (req, res) => {
  systemStopped = true;

  robots = robots.map(r => ({
    ...r,
    status: "stopped"
  }));

  io.emit("robots", robots);

  res.json({ message: "Система остановлена" });
});

app.post("/api/start", (req, res) => {
  systemStopped = false;
  res.json({ message: "Система запущена" });
});

setInterval(() => {
  if (systemStopped) return;
  robots = robots.map(r => {
    const statuses = ["active", "idle", "error"];
    return {
      ...r,
      status: statuses[Math.floor(Math.random() * 3)],
      battery: Math.min(100, Math.max(0,
        r.status === "active"
          ? r.battery - Math.random() * 5   // разряжается
          : r.battery + Math.random() * 3   // заряжается
      ))
    };
  });
  io.emit("robots", robots);
}, 3000);

io.on("connection", (socket) => {
  console.log("Client connected");

  socket.emit("robots", robots);
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
