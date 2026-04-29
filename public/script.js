const socket = io();

let robots = [];
let filterStatus = "all";
let historyData = {};
let batteryChart, workChart;

const userData = JSON.parse(localStorage.getItem("user"));
document.getElementById("role").innerText = "Роль: " + userData.role;

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
      historyData[r.id] = { battery: [], work: [] };
    }

    historyData[r.id].battery.push(r.battery);
    historyData[r.id].work.push(r.status === "active" ? 1 : 0);

    if (historyData[r.id].battery.length > 10) {
      historyData[r.id].battery.shift();
      historyData[r.id].work.shift();
    }
  });
}

function updateCharts() {
  const r = robots[0];
  const h = historyData[r.id];

  if (!batteryChart) {
    batteryChart = new Chart(document.getElementById("batteryChart"), {
      type: "line",
      data: { labels: h.battery.map((_, i)=>i), datasets: [{ label: "Battery", data: h.battery }] }
    });
  } else {
    batteryChart.data.labels = h.battery.map((_, i)=>i);
    batteryChart.data.datasets[0].data = h.battery;
    batteryChart.update();
  }

  if (!workChart) {
    workChart = new Chart(document.getElementById("workChart"), {
      type: "line",
      data: { labels: h.work.map((_, i)=>i), datasets: [{ label: "Work", data: h.work }] }
    });
  } else {
    workChart.data.labels = h.work.map((_, i)=>i);
    workChart.data.datasets[0].data = h.work;
    workChart.update();
  }
}
