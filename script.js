// script.js

const stockTable =
  document.getElementById("stockTable");

const totalProfit =
  document.getElementById("totalProfit");

const addBtn =
  document.getElementById("addBtn");

let stocks =
  JSON.parse(localStorage.getItem("stocks")) || [];

renderStocks();

addBtn.addEventListener("click", addStock);

function addStock() {

  const name =
    document.getElementById("name").value;

  const shares =
    Number(document.getElementById("shares").value);

  const buyPrice =
    Number(document.getElementById("buyPrice").value);

  const currentPrice =
    Number(document.getElementById("currentPrice").value);

  const tag =
    document.getElementById("tag").value;

  const memo =
    document.getElementById("memo").value;

  const sellRule =
    document.getElementById("sellRule").value;

  const diary =
    document.getElementById("diary").value;

  if (!name || !shares || !buyPrice || !currentPrice) {
    alert("必須項目を入力してください");
    return;
  }

  const date =
    new Date().toLocaleDateString();

  const stock = {
    date,
    name,
    shares,
    buyPrice,
    currentPrice,
    tag,
    memo,
    sellRule,
    diary
  };

  stocks.push(stock);

  saveStocks();

  renderStocks();

  clearInputs();
}

function renderStocks() {

  stockTable.innerHTML = "";

  let total = 0;

  stocks.forEach((stock, index) => {

    const profit =
      (stock.currentPrice - stock.buyPrice)
      * stock.shares;

    const profitRate =
      (
        (
          (stock.currentPrice - stock.buyPrice)
          / stock.buyPrice
        ) * 100
      ).toFixed(2);

    total += profit;

    const tr =
      document.createElement("tr");

    tr.innerHTML = `
      <td>${stock.date}</td>

      <td>${stock.name}</td>

      <td>${stock.shares}</td>

      <td>${stock.buyPrice.toLocaleString()} 円</td>

      <td>${stock.currentPrice.toLocaleString()} 円</td>

      <td class="${profit >= 0 ? "plus" : "minus"}">
        ${profit.toLocaleString()} 円
      </td>

      <td class="${profit >= 0 ? "plus" : "minus"}">
        ${profitRate} %
      </td>

      <td>
        <span class="tag">
          ${stock.tag || ""}
        </span>
      </td>

      <td>${stock.memo || ""}</td>

      <td>${stock.sellRule || ""}</td>

      <td>${stock.diary || ""}</td>

      <td>
        <button onclick="editStock(${index})">
          編集
        </button>
      </td>

      <td>
        <button onclick="deleteStock(${index})">
          削除
        </button>
      </td>
    `;

    stockTable.appendChild(tr);

  });

  totalProfit.innerHTML =
    `合計損益：${total.toLocaleString()} 円`;

  totalProfit.className =
    total >= 0
      ? "total-profit plus"
      : "total-profit minus";
}

function deleteStock(index) {

  if (confirm("削除しますか？")) {

    stocks.splice(index, 1);

    saveStocks();

    renderStocks();
  }
}

function editStock(index) {

  const stock = stocks[index];

  document.getElementById("name").value =
    stock.name;

  document.getElementById("shares").value =
    stock.shares;

  document.getElementById("buyPrice").value =
    stock.buyPrice;

  document.getElementById("currentPrice").value =
    stock.currentPrice;

  document.getElementById("tag").value =
    stock.tag || "";

  document.getElementById("memo").value =
    stock.memo || "";

  document.getElementById("sellRule").value =
    stock.sellRule || "";

  document.getElementById("diary").value =
    stock.diary || "";

  stocks.splice(index, 1);

  saveStocks();

  renderStocks();
}

function saveStocks() {

  localStorage.setItem(
    "stocks",
    JSON.stringify(stocks)
  );
}

function clearInputs() {

  document.getElementById("name").value = "";

  document.getElementById("shares").value = "";

  document.getElementById("buyPrice").value = "";

  document.getElementById("currentPrice").value = "";

  document.getElementById("tag").value = "";

  document.getElementById("memo").value = "";

  document.getElementById("sellRule").value = "";

  document.getElementById("diary").value = "";
}

document
  .getElementById("exportBtn")
  .addEventListener("click", exportCSV);

function exportCSV() {

  let csv =
    "日付,銘柄,株数,取得単価,現在株価,タグ,メモ,売却ルール,投資日記\n";

  stocks.forEach(stock => {

    csv +=
`${stock.date},
${stock.name},
${stock.shares},
${stock.buyPrice},
${stock.currentPrice},
${stock.tag},
${stock.memo},
${stock.sellRule},
${stock.diary}\n`;

  });

  const blob =
    new Blob([csv], { type: "text/csv" });

  const link =
    document.createElement("a");

  link.href =
    URL.createObjectURL(blob);

  link.download =
    "stocks.csv";

  link.click();
}

document
  .getElementById("importFile")
  .addEventListener("change", importCSV);

function importCSV(event) {

  const file =
    event.target.files[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload = function(e) {

    const lines =
      e.target.result.split("\n");

    lines.shift();

    lines.forEach(line => {

      const cols =
        line.split(",");

      if (cols.length < 9) return;

      stocks.push({
        date: cols[0],
        name: cols[1],
        shares: Number(cols[2]),
        buyPrice: Number(cols[3]),
        currentPrice: Number(cols[4]),
        tag: cols[5],
        memo: cols[6],
        sellRule: cols[7],
        diary: cols[8]
      });

    });

    saveStocks();

    renderStocks();

    alert("CSV取込完了");
  };

  reader.readAsText(file);
}