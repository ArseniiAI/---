const socket = io();

let robots = [];
let filterStatus = "all";
let historyData = {};
let batteryChart;

const userData = JSON.parse(localStorage.getItem("user"));
document.getElementById("role").innerText = "Роль: " + userData.role;
renderAdminControls();

socket.on("robots", (data) => {
  robots = data;
  updateHistory();
  render();
  updateCharts();
});

function filter(status) {
  filterStatus = status;
  render();
}

function render() {
  const table = document.getElementById("table");
  table.innerHTML = "";

  robots
    .filter(r => filterStatus === "all" || r.status === filterStatus)
    .forEach(r => {
      table.innerHTML += `
        <tr>
          <td>${r.id}</td>
          <td>${r.name}</td>
          <td class="${r.status}">${r.status}</td>
          <td>${r.battery.toFixed(0)}%</td>
        </tr>
      `;
    });
}

function updateHistory() {
  robots.forEach(r => {
    if (!historyData[r.id]) {
      historyData[r.id] = { battery: [],  };
    }

    historyData[r.id].battery.push(r.battery);
    

    if (historyData[r.id].battery.length > 10) {
      historyData[r.id].battery.shift();
      
    }
  });
}

function updateCharts() {
  const labels = Array.from({ length: 10 }, (_, i) => i);

  const datasets = robots.map(r => {
    const h = historyData[r.id];

    return {
      label: r.name,
      data: h ? h.battery : [],
      fill: false,
      tension: 0.3
    };
  });

  if (!batteryChart) {
    batteryChart = new Chart(document.getElementById("batteryChart"), {
      type: "line",
      data: {
        labels: labels,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          }
        }
      }
    });
  } else {
    batteryChart.data.datasets = datasets;
    batteryChart.update();
  }
}

 

// 🔁 смена роли
function logout() {
  localStorage.removeItem("user"); // удаляем пользователя
  window.location.href = "/login.html"; // возвращаем на вход
}

// 🎛 админ-панель
function renderAdminControls() {
  const user = JSON.parse(localStorage.getItem("user"));
  const div = document.getElementById("adminControls");

  if (user.role === "admin") {
    div.innerHTML = `
      <button onclick="stopSystem()">🛑 Аварийная остановка</button>
      <button onclick="startSystem()">▶️ Запуск</button>
    `;
  } else {
    div.innerHTML = "";
  }
}

// 🛑 стоп
async function stopSystem() {
  await fetch("/api/stop", { method: "POST" });
}

// ▶️ запуск
async function startSystem() {
  await fetch("/api/start", { method: "POST" });
}