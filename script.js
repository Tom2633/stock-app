const stockTable = document.getElementById("stockTable");
const totalProfit = document.getElementById("totalProfit");
const addBtn = document.getElementById("addBtn");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const sortBuyDateBtn = document.getElementById("sortBuyDateBtn");
const sortCodeBtn = document.getElementById("sortCodeBtn");
const sortProfitRateBtn = document.getElementById("sortProfitRateBtn");
const clearAllBtn = document.getElementById("clearAllBtn");

let stocks = JSON.parse(localStorage.getItem("stocks")) || [];
let editingIndex = null;
let currentSortMode = "code";

renderStocks();

addBtn.addEventListener("click", addStock);
exportBtn.addEventListener("click", exportCSV);
importFile.addEventListener("change", importCSV);
sortBuyDateBtn.addEventListener("click", sortByBuyDateDesc);
sortCodeBtn.addEventListener("click", sortByCodeAndRender);
sortProfitRateBtn.addEventListener("click", sortByProfitRateAsc);
clearAllBtn.addEventListener("click", clearAllStocks);

function saveStocks() {
  localStorage.setItem("stocks", JSON.stringify(stocks));
}

function escapeHTML(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
    .replace(/\n/g, "<br>");
}

function toNumber(value) {
  if (value == null) return NaN;
  return Number(String(value).replace(/,/g, "").replace(/\+/g, "").trim());
}

function makeId() {
  return Date.now().toString(36) + "_" + Math.random().toString(36).slice(2);
}

function parseBuyDateForSort(value) {
  if (!value || value === "----/--/--") return 0;
  const normalized = String(value).replace(/\./g, "/").replace(/-/g, "/").trim();
  const parts = normalized.split("/");
  if (parts.length < 3) return 0;
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const d = Number(parts[2]);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return 0;
  return y * 10000 + m * 100 + d;
}

function sortStocksByCode() {
  stocks.sort((a, b) =>
    String(a.code || "").localeCompare(String(b.code || ""), "ja", { numeric: true })
  );
}

function sortStocksByBuyDateDesc() {
  stocks.sort((a, b) => {
    const da = parseBuyDateForSort(a.buyDate);
    const db = parseBuyDateForSort(b.buyDate);
    if (db !== da) return db - da;
    return String(a.code || "").localeCompare(String(b.code || ""), "ja", { numeric: true });
  });
}

function getProfitRate(stock) {
  const buyPrice = Number(stock.buyPrice);
  const currentPrice = Number(stock.currentPrice);
  if (!buyPrice || isNaN(buyPrice) || isNaN(currentPrice)) return 999999;
  return ((currentPrice - buyPrice) / buyPrice) * 100;
}

function sortStocksByProfitRateAsc() {
  stocks.sort((a, b) => {
    const rateA = getProfitRate(a);
    const rateB = getProfitRate(b);
    if (rateA !== rateB) return rateA - rateB;
    return String(a.code || "").localeCompare(String(b.code || ""), "ja", { numeric: true });
  });
}

function applyCurrentSort() {
  if (currentSortMode === "buyDate") {
    sortStocksByBuyDateDesc();
  } else if (currentSortMode === "profitRate") {
    sortStocksByProfitRateAsc();
  } else {
    sortStocksByCode();
  }
}

function sortByBuyDateDesc() {
  currentSortMode = "buyDate";
  renderStocks();
}

function sortByCodeAndRender() {
  currentSortMode = "code";
  renderStocks();
}

function sortByProfitRateAsc() {
  currentSortMode = "profitRate";
  renderStocks();
}

function addStock() {
  const stock = {
    id: editingIndex !== null && stocks[editingIndex] ? stocks[editingIndex].id || makeId() : makeId(),
    code: editingIndex !== null && stocks[editingIndex] ? stocks[editingIndex].code || "" : "",
    date: editingIndex !== null && stocks[editingIndex] ? stocks[editingIndex].date || new Date().toLocaleDateString() : new Date().toLocaleDateString(),
    name: document.getElementById("name").value.trim(),
    shares: Number(document.getElementById("shares").value),
    buyPrice: Number(document.getElementById("buyPrice").value),
    currentPrice: Number(document.getElementById("currentPrice").value),
    accountType: document.getElementById("accountType").value,
    buyDate: document.getElementById("buyDate").value,
    tag: document.getElementById("tag").value,
    memo: document.getElementById("memo").value,
    sellRule: document.getElementById("sellRule").value,
    diary: document.getElementById("diary").value
  };

  if (!stock.name || !stock.shares || !stock.buyPrice || !stock.currentPrice) {
    alert("必須項目を入力してください");
    return;
  }

  if (editingIndex !== null) {
    stocks[editingIndex] = stock;
    editingIndex = null;
    addBtn.textContent = "追加";
  } else {
    stocks.push(stock);
  }

  applyCurrentSort();
  saveStocks();
  renderStocks();
  clearInputs();
}

function clearInputs() {
  document.getElementById("name").value = "";
  document.getElementById("shares").value = "";
  document.getElementById("buyPrice").value = "";
  document.getElementById("currentPrice").value = "";
  document.getElementById("accountType").value = "";
  document.getElementById("buyDate").value = "";
  document.getElementById("tag").value = "";
  document.getElementById("memo").value = "";
  document.getElementById("sellRule").value = "";
  document.getElementById("diary").value = "";
}

function renderStocks() {
  stockTable.innerHTML = "";
  const mobileCards = document.getElementById("mobileCards");
  mobileCards.innerHTML = "";

  applyCurrentSort();

  let total = 0;

  stocks.forEach((stock, index) => {
    const shares = Number(stock.shares);
    const buyPrice = Number(stock.buyPrice);
    const currentPrice = Number(stock.currentPrice);
    if (isNaN(shares) || isNaN(buyPrice) || isNaN(currentPrice)) return;

    const profit = (currentPrice - buyPrice) * shares;
    const profitRate = buyPrice === 0 ? 0 : ((currentPrice - buyPrice) / buyPrice * 100);
    total += profit;
    const plusMinus = profit >= 0 ? "plus" : "minus";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${escapeHTML(stock.code || "")}</td>
      <td>${escapeHTML(stock.name || "")}</td>
      <td>${escapeHTML(stock.accountType || "")}</td>
      <td>${escapeHTML(stock.buyDate || "")}</td>
      <td>${shares.toLocaleString()}</td>
      <td>${buyPrice.toLocaleString()}</td>
      <td>${currentPrice.toLocaleString()}</td>
      <td class="${plusMinus}">${profit.toLocaleString()}円</td>
      <td class="${plusMinus}">${profitRate.toFixed(2)}%</td>
      <td>${escapeHTML(stock.tag || "")}</td>
      <td class="note-cell">${escapeHTML(stock.memo || "")}</td>
      <td class="note-cell">${escapeHTML(stock.sellRule || "")}</td>
      <td class="note-cell">${escapeHTML(stock.diary || "")}</td>
      <td><button onclick="editStock(${index})">編集</button></td>
      <td><button onclick="deleteStock(${index})">削除</button></td>
    `;
    stockTable.appendChild(tr);

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <div class="card-top">
        <div>
          <div class="card-name">${escapeHTML(stock.name || "")}</div>
          <div class="card-code">
            ${escapeHTML(stock.code || "")}
            ${stock.accountType ? `<span class="badge">${escapeHTML(stock.accountType)}</span>` : ""}
            ${stock.buyDate ? `<span class="badge">${escapeHTML(stock.buyDate)}</span>` : ""}
            ${stock.tag ? `<span class="badge">${escapeHTML(stock.tag)}</span>` : ""}
          </div>
        </div>
        <div class="card-profit ${plusMinus}">
          ${profit.toLocaleString()}円<br>
          <span style="font-size:12px;">${profitRate.toFixed(2)}%</span>
        </div>
      </div>
      <div class="card-line">
        <span>株:${shares.toLocaleString()}</span>
        <span>取得:${buyPrice.toLocaleString()}</span>
        <span>現在:${currentPrice.toLocaleString()}</span>
      </div>
      <div class="card-buttons">
        <button onclick="editStock(${index})">編集</button>
        <button onclick="deleteStock(${index})">削除</button>
      </div>
    `;
    mobileCards.appendChild(card);
  });

  totalProfit.innerHTML = `合計損益：${total.toLocaleString()} 円`;
  totalProfit.className = total >= 0 ? "total-profit plus" : "total-profit minus";
}

function deleteStock(index) {
  stocks.splice(index, 1);
  saveStocks();
  renderStocks();
}

function editStock(index) {
  const stock = stocks[index];
  document.getElementById("name").value = stock.name || "";
  document.getElementById("shares").value = stock.shares || "";
  document.getElementById("buyPrice").value = stock.buyPrice || "";
  document.getElementById("currentPrice").value = stock.currentPrice || "";
  document.getElementById("accountType").value = stock.accountType || "";
  document.getElementById("buyDate").value = stock.buyDate || "";
  document.getElementById("tag").value = stock.tag || "";
  document.getElementById("memo").value = stock.memo || "";
  document.getElementById("sellRule").value = stock.sellRule || "";
  document.getElementById("diary").value = stock.diary || "";

  editingIndex = index;
  addBtn.textContent = "更新";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearAllStocks() {
  if (!confirm("登録済みの全銘柄を削除しますか？")) return;
  stocks = [];
  localStorage.removeItem("stocks");
  editingIndex = null;
  addBtn.textContent = "追加";
  renderStocks();
}

function escapeCSV(value) {
  if (value == null) return "";
  value = String(value);
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    value = '"' + value.replace(/"/g, '""') + '"';
  }
  return value;
}

function exportCSV() {
  let csv = "ID,コード,日付,銘柄,口座区分,買付日,株数,取得単価,現在株価,タグ,メモ,売却ルール,投資日記\n";
  applyCurrentSort();
  stocks.forEach(stock => {
    const row = [
      escapeCSV(stock.id || makeId()),
      escapeCSV(stock.code),
      escapeCSV(stock.date),
      escapeCSV(stock.name),
      escapeCSV(stock.accountType),
      escapeCSV(stock.buyDate),
      escapeCSV(stock.shares),
      escapeCSV(stock.buyPrice),
      escapeCSV(stock.currentPrice),
      escapeCSV(stock.tag),
      escapeCSV(stock.memo),
      escapeCSV(stock.sellRule),
      escapeCSV(stock.diary)
    ];
    csv += row.join(",") + "\n";
  });

  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);

  const now = new Date();
  const filename =
    "stock" +
    String(now.getFullYear()).slice(-2) +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    "_" +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0") +
    String(now.getSeconds()).padStart(2, "0");

  link.download = `${filename}.csv`;
  link.click();
}

function importCSV(event) {
  const files = Array.from(event.target.files);
  if (!files.length) return;
  const readers = files.map(file => readFileText(file));
  Promise.all(readers).then(texts => {
    const allLines = texts.map(text => text.split(/\r?\n/));
    const isSBI = allLines.some(lines => lines.some(line => line.includes("銘柄（コード）")));
    const isApp = allLines.length === 1 &&
      allLines[0][0]?.replace(/^\uFEFF/, "").includes("コード") &&
      allLines[0][0]?.replace(/^\uFEFF/, "").includes("銘柄");

    if (isSBI) {
      importSBICSV(allLines);
      importFile.value = "";
      return;
    }
    if (isApp) {
      importAppCSV(allLines[0]);
      importFile.value = "";
      return;
    }
    alert("未対応CSV形式");
    importFile.value = "";
  });
}

function readFileText(file) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => resolve(e.target.result);
    reader.readAsText(file, "Shift-JIS");
  });
}

function importAppCSV(lines) {
  const header = parseCSVLine(lines[0].replace(/^\uFEFF/, ""));
  const importedStocks = [];
  lines.slice(1).forEach(line => {
    if (!line.trim()) return;
    const cols = parseCSVLine(line);

    if (header.includes("口座区分") && header.includes("買付日")) {
      const shares = toNumber(cols[6]);
      const buyPrice = toNumber(cols[7]);
      const currentPrice = toNumber(cols[8]);
      if (isNaN(shares) || isNaN(buyPrice) || isNaN(currentPrice)) return;
      importedStocks.push({
        id: cols[0] || makeId(),
        code: cols[1] || "",
        date: cols[2] || new Date().toLocaleDateString(),
        name: cols[3] || "",
        accountType: cols[4] || "",
        buyDate: cols[5] || "",
        shares,
        buyPrice,
        currentPrice,
        tag: cols[9] || "",
        memo: cols[10] || "",
        sellRule: cols[11] || "",
        diary: cols[12] || ""
      });
      return;
    }
  });
  stocks = importedStocks;
  currentSortMode = "code";
  sortStocksByCode();
  saveStocks();
  renderStocks();
  alert(`${stocks.length}件読み込みました`);
}

function importSBICSV(linesArray) {
  const existingMemoMap = createExistingMemoMap();
  const importedStocks = [];
  linesArray.forEach(lines => {
    let start = false;
    lines.forEach(line => {
      if (line.includes("銘柄（コード）")) {
        start = true;
        return;
      }
      if (!start || !line.trim()) return;
      const cols = parseCSVLine(line);
      if (cols.length < 8) return;
      const rawName = (cols[0] || "").trim();
      if (!rawName) return;
      const parts = rawName.split(/\s+/);
      if (parts.length < 2 || !/^[0-9A-Z]+$/.test(parts[0])) return;

      const code = parts[0];
      const name = parts.slice(1).join(" ");
      const shares = toNumber(cols[1]);
      const buyPrice = toNumber(cols[2]);
      const currentPrice = toNumber(cols[3]);
      const accountType = cols[6] || "";
      const buyDate = cols[7] || "";
      if (isNaN(shares) || isNaN(buyPrice) || isNaN(currentPrice)) return;

      const memoKey = makeMemoKey(code, shares, buyPrice, accountType, buyDate);
      const existing = existingMemoMap[memoKey] || {};

      importedStocks.push({
        id: makeId(),
        code,
        date: existing.date || new Date().toLocaleDateString(),
        name,
        accountType,
        buyDate,
        shares,
        buyPrice,
        currentPrice,
        tag: existing.tag || "",
        memo: existing.memo || "",
        sellRule: existing.sellRule || "",
        diary: existing.diary || ""
      });
    });
  });
  stocks = stocks.concat(importedStocks);
  applyCurrentSort();
  saveStocks();
  renderStocks();
  alert(`${importedStocks.length}件追加しました`);
}

function makeMemoKey(code, shares, buyPrice, accountType, buyDate) {
  return `${code}_${shares}_${buyPrice}_${accountType || ""}_${buyDate || ""}`;
}

function createExistingMemoMap() {
  const map = {};
  stocks.forEach(stock => {
    const key = makeMemoKey(
      stock.code || "",
      stock.shares,
      stock.buyPrice,
      stock.accountType || "",
      stock.buyDate || ""
    );
    map[key] = {
      date: stock.date,
      tag: stock.tag,
      memo: stock.memo,
      sellRule: stock.sellRule,
      diary: stock.diary
    };
  });
  return map;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result.map(value => value.replace(/^"|"$/g, ""));
}
