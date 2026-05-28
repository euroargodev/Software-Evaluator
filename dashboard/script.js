const levels = ["Novice", "Beginner", "Intermediate", "Advanced", "Expert"];

let globalData = [];

const getColorClass = (score) => {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  return "low";
};

const computeLevelScores = (repo) => {
  const result = {};

  levels.forEach((level) => {
    const items = Object.values(repo.details).filter(
      (i) => i.level === level && i.type === "auto"
    );

    const total = items.length;
    const met = items.filter(i => i.status === "met").length;

    result[level] = {
      score: total === 0 ? 0 : met / total,
      items,
      met,
      total
    };
  });

  return result;
};

const countMetCriteria = (repo) => {
  return Object.values(repo.details).filter(
    (i) => i.status === "met" && i.type === "auto"
  ).length;
};

const computeGlobalScore = (scores) => {
  return Object.values(scores).reduce((acc, s) => acc + s.score, 0) / levels.length;
};

const renderTable = (data) => {
  const tbody = document.querySelector("#dashboard tbody");
  tbody.innerHTML = "";

  data.forEach(repo => {
    const scores = computeLevelScores(repo);
    const row = document.createElement("tr");

    const repoCell = document.createElement("td");
    repoCell.innerHTML = `<a href="${repo.repository.url}" target="_blank">${repo.repository.repo}</a>`;
    row.appendChild(repoCell);

    levels.forEach(level => {
      const { score, items, met, total } = scores[level];
      const percent = (score * 100).toFixed(0);

      const cell = document.createElement("td");
      cell.innerHTML = `
        <div class="bar">
          <div class="fill ${getColorClass(score)}" style="width:${percent}%"></div>
        </div>
        <div class="score-text">${percent}% (${met}/${total})</div>
      `;

      cell.onclick = () => openPopup(repo.repository.repo, level, items);
      row.appendChild(cell);
    });
    const totalMet = countMetCriteria(repo);
    repoCell.innerHTML = `
      <a href="${repo.repository.url}" target="_blank">
        ${repo.repository.repo}
      </a>
      <div style="font-size:10px; color:#6b7280">
        ${totalMet} criteria met
      </div>
    `;
    tbody.appendChild(row);
  });
};

// Stats
const computeStats = (data) => {
  let low = 0, medium = 0, high = 0;

  data.forEach(repo => {
    const score = computeGlobalScore(computeLevelScores(repo));

    if (score < 0.4) low++;
    else if (score < 0.7) medium++;
    else high++;
  });

  document.getElementById("stats").innerHTML ="";
};

// Load
fetch("data.json")
  .then(res => res.json())
  .then(data => {
    globalData = data;

    document.getElementById("summary").innerText =
      `${data.length} repositories evaluated`;

    computeStats(data);
    renderTable(data);
  });

// Search
document.getElementById("search").addEventListener("input", (e) => {
  const value = e.target.value.toLowerCase();

  const filtered = globalData.filter(r =>
    r.repository.repo.toLowerCase().includes(value)
  );

  renderTable(filtered);
});

// Sort
document.getElementById("sort").addEventListener("change", (e) => {
  const value = e.target.value;
  let sorted = [...globalData];

  if (value === "score-desc") {
    sorted.sort((a, b) =>
      countMetCriteria(b) - countMetCriteria(a)
    );
  }

  if (value === "score-asc") {
    sorted.sort((a, b) =>
      countMetCriteria(a) - countMetCriteria(b)
    );
  }

  if (value === "name") {
    sorted.sort((a, b) =>
      a.repository.repo.localeCompare(b.repository.repo)
    );
  }

  renderTable(sorted);
});

// Popup
const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popup-title");
const popupList = document.getElementById("popup-list");

function openPopup(repo, level, items) {
  popupTitle.innerText = `${repo} - ${level}`;
  popupList.innerHTML = "";

  items.sort((a) => (a.status === "met" ? 1 : -1));

  items.forEach(item => {
    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${item.title}</strong>
      ${item.url ? `
        <a href="${item.url}" target="_blank" class="details-link">
          Details ↗
        </a>
      ` : ""}
    `;

    li.style.color = item.status === "met" ? "#16a34a" : "#dc2626";

    popupList.appendChild(li);
  });

  popup.classList.remove("hidden");
}

document.getElementById("export").onclick = () => {
  const blob = new Blob([JSON.stringify(globalData, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = "dashboard_data.json";
  a.click();

  URL.revokeObjectURL(url);
};

document.getElementById("close").onclick = () =>
  popup.classList.add("hidden");