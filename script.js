
// ====================================
// 1. GET HTML ELEMENTS
// ====================================

const expenseForm = document.getElementById("expenseForm");
const expenseModal = document.getElementById("expenseModal");

const openModalBtn = document.getElementById("openModalBtn");
const closeModalBtn = document.getElementById("closeModalBtn");

const expenseTable = document.getElementById("expenseTable");
const searchInput = document.getElementById("searchInput");
const sortSelect = document.getElementById("sortSelect");

const totalAmount = document.getElementById("totalAmount");
const totalCount = document.getElementById("totalCount");
const highestExpense = document.getElementById("highestExpense");

const categoryBreakdown = document.getElementById("categoryBreakdown");
const monthlyChart = document.getElementById("monthlyChart");

const resultCount = document.getElementById("resultCount");
const clearSearchBtn = document.getElementById("clearSearchBtn");


// ====================================
// 2. INITIAL DATA AND STORAGE
// ====================================

const starterExpenses = [
    {
        id: 1,
        title: "Groceries",
        category: "Food",
        amount: 850,
        date: getDateOffset(-1),
        description: "Weekly groceries"
    },
    {
        id: 2,
        title: "College bus pass",
        category: "Travel",
        amount: 420,
        date: getDateOffset(-3),
        description: "Monthly bus pass"
    },
    {
        id: 3,
        title: "Notebook and pens",
        category: "Education",
        amount: 280,
        date: getDateOffset(-5),
        description: "College stationery"
    },
    {
        id: 4,
        title: "Phone recharge",
        category: "Bills",
        amount: 299,
        date: getDateOffset(-7),
        description: "Mobile recharge"
    }
];

function getDateOffset(days) {
    const date = new Date();
    date.setDate(date.getDate() + days);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}


// Load previously saved expenses.

let expenses = [];

function loadExpenses() {

    try {
        const savedData = localStorage.getItem("pennywise-expenses");

        if (savedData === null) {
            expenses = [...starterExpenses];
            saveExpenses();
        } else {
            const parsedData = JSON.parse(savedData);

            if (!Array.isArray(parsedData)) {
                throw new Error("Invalid saved data");
            }

            expenses = parsedData;
        }

    } catch (error) {
        expenses = [...starterExpenses];
        showToast("Could not read saved data. Sample data loaded.");
    }
}


// Save expenses to browser storage.

function saveExpenses() {

    try {
        localStorage.setItem(
            "pennywise-expenses",
            JSON.stringify(expenses)
        );
    } catch (error) {
        showToast("Could not save data in this browser.");
    }
}


// Find the next available ID.

function getNextId() {
    if (expenses.length === 0) {
        return 1;
    }

    const largestId = Math.max(...expenses.map(expense => expense.id));

    return largestId + 1;
}


// ====================================
// 3. ADD EXPENSE
// ====================================

openModalBtn.addEventListener("click", function () {
    expenseModal.classList.add("show");

    document.getElementById("expenseDate").value = getDateOffset(0);
});

closeModalBtn.addEventListener("click", closeModal);

expenseModal.addEventListener("click", function (event) {
    if (event.target === expenseModal) {
        closeModal();
    }
});

function closeModal() {
    expenseModal.classList.remove("show");
    expenseForm.reset();
}

expenseForm.addEventListener("submit", function (event) {

    event.preventDefault();

    const title = document.getElementById("expenseTitle").value.trim();
    const category = document.getElementById("expenseCategory").value;
    const amount = Number(document.getElementById("expenseAmount").value);
    const date = document.getElementById("expenseDate").value;
    const description = document.getElementById("expenseDescription").value.trim();

    if (
        title === "" ||
        category === "" ||
        !Number.isFinite(amount) ||
        amount <= 0 ||
        date === ""
    ) {
        showToast("Please enter valid expense details.");
        return;
    }

    const newExpense = {
        id: getNextId(),
        title: title,
        category: category,
        amount: amount,
        date: date,
        description: description
    };

    expenses.push(newExpense);

    saveExpenses();

    renderDashboard();

    closeModal();

    showToast("Expense added successfully!");
});


// ====================================
// 4. DISPLAY EXPENSES
// ====================================

function displayExpenses() {

    let filteredExpenses = [...expenses];

    // Search by ID.

    const searchValue = searchInput.value.trim();

    if (searchValue !== "") {
        filteredExpenses = filteredExpenses.filter(expense =>
            String(expense.id).includes(searchValue)
        );
    }

    // Sort expenses.

    const sortValue = sortSelect.value;

    if (sortValue === "newest") {
        filteredExpenses.sort((a, b) =>
            b.date.localeCompare(a.date) || b.id - a.id
        );
    }

    else if (sortValue === "oldest") {
        filteredExpenses.sort((a, b) =>
            a.date.localeCompare(b.date) || a.id - b.id
        );
    }

    else if (sortValue === "high") {
        filteredExpenses.sort((a, b) => b.amount - a.amount);
    }

    else if (sortValue === "low") {
        filteredExpenses.sort((a, b) => a.amount - b.amount);
    }

    // Clear the old table.

    expenseTable.innerHTML = "";

    if (filteredExpenses.length === 0) {

        expenseTable.innerHTML = `
            <tr>
                <td colspan="6" class="empty-message">
                    No expenses found.
                </td>
            </tr>
        `;

    } else {

        filteredExpenses.forEach(expense => {

            const row = document.createElement("tr");

            const cells = [
                expense.id,
                expense.title,
                expense.category,
                formatDate(expense.date),
                formatMoney(expense.amount)
            ];

            cells.forEach(value => {
                const cell = document.createElement("td");
                cell.textContent = value;
                row.appendChild(cell);
            });

            const actionCell = document.createElement("td");

            const deleteButton = document.createElement("button");

            deleteButton.textContent = "Delete";
            deleteButton.className = "delete-btn";

            deleteButton.addEventListener("click", function () {
                deleteExpense(expense.id);
            });

            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            expenseTable.appendChild(row);
        });
    }

    resultCount.textContent =
        `${filteredExpenses.length} transactions`;
}


// ====================================
// 5. CALCULATE TOTAL AND HIGHEST
// ====================================

function calculateSummary() {

    let total = 0;
    let highest = 0;

    expenses.forEach(expense => {

        total += expense.amount;

        if (expense.amount > highest) {
            highest = expense.amount;
        }

    });

    totalAmount.textContent = formatMoney(total);

    totalCount.textContent = expenses.length;

    highestExpense.textContent = formatMoney(highest);
}


// ====================================
// 6. DELETE EXPENSE
// ====================================

function deleteExpense(id) {

    const confirmed = confirm(
        "Are you sure you want to delete this expense?"
    );

    if (!confirmed) {
        return;
    }

    expenses = expenses.filter(expense => expense.id !== id);

    saveExpenses();

    renderDashboard();

    showToast("Expense deleted successfully!");
}


// ====================================
// 7. CATEGORY BREAKDOWN
// ====================================

function displayCategories() {

    categoryBreakdown.innerHTML = "";

    if (expenses.length === 0) {
        categoryBreakdown.innerHTML =
            `<p class="empty-message">No expenses recorded yet.</p>`;
        return;
    }

    const categoryTotals = {};

    expenses.forEach(expense => {

        if (categoryTotals[expense.category] === undefined) {
            categoryTotals[expense.category] = 0;
        }

        categoryTotals[expense.category] += expense.amount;

    });

    const total = expenses.reduce(
        (sum, expense) => sum + expense.amount,
        0
    );

    Object.entries(categoryTotals)
        .sort((a, b) => b[1] - a[1])
        .forEach(([category, amount]) => {

            const percentage = (amount / total) * 100;

            const item = document.createElement("div");
            item.className = "category-item";

            const info = document.createElement("div");
            info.className = "category-info";

            const categoryName = document.createElement("span");
            categoryName.textContent = category;

            const categoryAmount = document.createElement("span");
            categoryAmount.textContent = formatMoney(amount);

            info.appendChild(categoryName);
            info.appendChild(categoryAmount);

            const progress = document.createElement("div");
            progress.className = "progress-bg";

            const fill = document.createElement("div");
            fill.className = "progress-fill";
            fill.style.width = `${percentage}%`;

            progress.appendChild(fill);

            item.appendChild(info);
            item.appendChild(progress);

            categoryBreakdown.appendChild(item);

        });
}


// ====================================
// 8. MONTHLY SPENDING CHART
// ====================================

function displayMonthlyChart() {

    monthlyChart.innerHTML = "";

    const months = [];

    for (let i = 5; i >= 0; i--) {

        const date = new Date();

        date.setDate(1);
        date.setMonth(date.getMonth() - i);

        months.push({
            year: date.getFullYear(),
            month: date.getMonth(),
            label: date.toLocaleString("en-IN", {
                month: "short"
            }),
            total: 0
        });
    }

    expenses.forEach(expense => {

        const expenseDate = new Date(expense.date + "T00:00:00");

        const matchingMonth = months.find(month =>
            month.year === expenseDate.getFullYear() &&
            month.month === expenseDate.getMonth()
        );

        if (matchingMonth) {
            matchingMonth.total += expense.amount;
        }

    });

    const maxAmount = Math.max(
        ...months.map(month => month.total),
        1
    );

    months.forEach(month => {

        const column = document.createElement("div");
        column.className = "chart-column";

        const bar = document.createElement("div");
        bar.className = "bar";

        const height = month.total === 0
            ? 3
            : (month.total / maxAmount) * 100;

        bar.style.height = `${height}%`;
        bar.title = formatMoney(month.total);

        const label = document.createElement("span");
        label.textContent = month.label;

        column.appendChild(bar);
        column.appendChild(label);

        monthlyChart.appendChild(column);

    });
}


// ====================================
// 9. FORMAT VALUES
// ====================================

function formatMoney(amount) {

    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
    }).format(amount);

}

function formatDate(date) {

    if (!date) {
        return "-";
    }

    const parts = date.split("-");

    if (parts.length !== 3) {
        return date;
    }

    return `${parts[2]}/${parts[1]}/${parts[0]}`;

}


// ====================================
// 10. SEARCH AND SORT EVENTS
// ====================================

searchInput.addEventListener("input", displayExpenses);

sortSelect.addEventListener("change", displayExpenses);

clearSearchBtn.addEventListener("click", function () {

    searchInput.value = "";
    sortSelect.value = "newest";

    displayExpenses();

});


// ====================================
// 11. TOAST MESSAGE
// ====================================

function showToast(message) {

    const toast = document.getElementById("toast");

    toast.textContent = message;

    toast.classList.add("show");

    setTimeout(function () {
        toast.classList.remove("show");
    }, 2500);

}


// ====================================
// 12. UPDATE ENTIRE DASHBOARD
// ====================================

function renderDashboard() {

    calculateSummary();

    displayExpenses();

    displayCategories();

    displayMonthlyChart();

}


// ====================================
// 13. START THE WEBSITE
// ====================================

loadExpenses();

renderDashboard();
