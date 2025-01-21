async function loadJSON() {
  const response = await fetch("../../assets/json/report.json");
  if (!response.ok) {
    throw new Error("Failed to load JSON report");
  }
  return await response.json();
}

function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sortRulesByImpact(rules, ascending = true) {
  const impactOrder = { minor: 1, moderate: 2, serious: 3 };
  return rules.sort((a, b) => {
    const comparison = (impactOrder[a.impact] || 4) - (impactOrder[b.impact] || 4);
    return ascending ? comparison : -comparison;
  });
}

function sortRulesById(rules, ascending = true) {
  return rules.sort((a, b) => {
    const comparison = a.id.localeCompare(b.id);
    return ascending ? comparison : -comparison;
  });
}

function createSection(title, rules, id, isExpanded = false) {
  const section = document.createElement("section");
  section.id = id;

  // Add a collapsible header
  section.innerHTML = `
    <h2 class="collapsible ${isExpanded ? "active" : ""}" style="cursor: pointer;">
      <span class="indicator">${isExpanded ? "▼" : "►"}</span> ${title} (${rules.length})</h2>
    <div class="content" style="display: ${isExpanded ? "block" : "none"};">
      ${rules.length === 0 ? `<p>No ${title.toLowerCase()} found.</p>` : createTable(rules, id)}
    </div>
  `;

  // Add event listener for collapsible behavior
  const header = section.querySelector(".collapsible");
  const content = section.querySelector(".content");
  const indicator = section.querySelector(".indicator");

  header.addEventListener("click", () => {
    const isHidden = content.style.display === "none";
    content.style.display = isHidden ? "block" : "none";
    header.classList.toggle("active", isHidden);
    indicator.textContent = isHidden ? "▼" : "►"; // Update indicator
  });

  return section;
}

function createTable(rules, sectionId) {
  return `
    <table class="report-table" data-section="${sectionId}">
      <thead>
        <tr>
          <th class="sortable" data-column="id" data-order="asc">ID</th>
          <th>Description</th>
          <th class="sortable" data-column="impact" data-order="asc">Impact</th>
          <th>Help</th>
          <th>Nodes</th>
        </tr>
      </thead>
      <tbody>
        ${renderTableBody(rules)}
      </tbody>
    </table>
  `;
}

function renderTableBody(rules) {
  return rules
    .map(
      (rule) => `
      <tr>
        <td>${escapeHTML(rule.id)}</td>
        <td>${escapeHTML(rule.description)}</td>
        <td class="${rule.impact || "info"}">${escapeHTML(
        rule.impact || "N/A"
      )}</td>
        <td><a href="${rule.helpUrl}" target="_blank">${escapeHTML(rule.help)}</a></td>
        <td>${rule.nodes
          .map(
            (node) => `
          <details>
            <summary>${node.target.map(escapeHTML).join(", ")}</summary>
            <pre>${escapeHTML(node.html)}</pre>
          </details>
        `
          )
          .join("")}</td>
      </tr>
    `
    )
    .join("");
}

function addSortingListeners(data) {
  const report = document.getElementById("report");

  report.addEventListener("click", (event) => {
    const header = event.target.closest(".sortable");
    if (!header) return;

    const table = header.closest("table");
    const sectionId = table.dataset.section;
    const column = header.dataset.column;
    const ascending = header.dataset.order === "asc";

    let sortedRules = [];
    if (column === "id") {
      sortedRules = sortRulesById([...data[sectionId]], ascending);
    } else if (column === "impact") {
      sortedRules = sortRulesByImpact([...data[sectionId]], ascending);
    }

    // Toggle the sorting order for the next click
    header.dataset.order = ascending ? "desc" : "asc";

    // Update only the <tbody> content
    const tbody = table.querySelector("tbody");
    tbody.innerHTML = renderTableBody(sortedRules);

    // Update the data for the section
    data[sectionId] = sortedRules;
  });
}

async function renderReport() {
  try {
    const data = await loadJSON();

    // Organize data by section for sorting
    const sectionData = {
      violations: data.violations,
      incomplete: data.incomplete,
      passes: data.passes,
      inapplicable: data.inapplicable,
    };

    const report = document.getElementById("report");
    report.innerHTML = "";

    // Add sections
    report.appendChild(createSection("Violations", sectionData.violations, "violations", true)); // Expanded by default
    report.appendChild(createSection("Incomplete", sectionData.incomplete, "incomplete"));
    report.appendChild(createSection("Passes", sectionData.passes, "passes"));
    report.appendChild(createSection("Inapplicable", sectionData.inapplicable, "inapplicable"));

    // Add sorting listeners using event delegation
    addSortingListeners(sectionData);
  } catch (error) {
    console.error(error);
    const report = document.getElementById("report");
    report.innerHTML = `<p class="error">Failed to load report: ${error.message}</p>`;
  }
}

renderReport();
