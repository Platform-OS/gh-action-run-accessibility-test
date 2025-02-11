async function loadJSON(file) {
  const response = await fetch(file);
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

function createSection(title, rules, id, isExpanded = false) {
  const section = document.createElement("section");
  section.id = id;

  // Add a collapsible header
  section.innerHTML = `
    <h3 class="collapsible ${isExpanded ? "active" : ""}" style="cursor: pointer;">
      <span class="indicator">${isExpanded ? "▼" : "►"}</span> ${title} (${rules.length})</h3>
    <div class="content" style="display: ${isExpanded ? "block" : "none"};">
      ${rules.length === 0 ? `<p>No ${title.toLowerCase()} found.</p>` : createTable(rules, id)}
    </div>
  `;

  // Add event listener for collapsible behavior
  const header = section.querySelector(".collapsible");
  const content = section.querySelector(".content");
  const indicator = section.querySelector(".indicator");

  header.addEventListener("click", () => {
    if (event.target.closest("table")) {
      return;
    }

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

async function renderReport() {
  const report = document.getElementById("reports");
  const reportFiles = jsonFiles;

  report.innerHTML = ""; // Clear existing content

  for (const file of reportFiles) {
    try {
      const data = await loadJSON(file);
      const pageName = file.match(/scripts\/(\w+)/)[1];

      // Organize data by section
      const sectionData = {
        violations: data.violations,
        incomplete: data.incomplete,
        passes: data.passes,
        inapplicable: data.inapplicable,
      };

      // Create a parent wrapper for this file's sections
      const reportWrapper = document.createElement("div");
      reportWrapper.className = "report-wrapper";
      reportWrapper.id = `report-wrapper-${pageName}`; // Optional: Add unique ID for each wrapper

      // Add an h2 heading to the wrapper
      const heading = document.createElement("h2");
      heading.textContent = `Report for ${pageName} page`;
      reportWrapper.appendChild(heading);

      // Add sections for this file
      reportWrapper.appendChild(createSection("Violations", sectionData.violations, "violations", true)); // Expanded by default
      reportWrapper.appendChild(createSection("Incomplete", sectionData.incomplete, "incomplete"));
      reportWrapper.appendChild(createSection("Passes", sectionData.passes, "passes"));
      reportWrapper.appendChild(createSection("Inapplicable", sectionData.inapplicable, "inapplicable"));

      // Append the wrapper to the main report container
      report.appendChild(reportWrapper);
    } catch (error) {
      console.error(error);
      const errorWrapper = document.createElement("div");
      errorWrapper.className = "error-wrapper";
      errorWrapper.innerHTML = `<p class="error">Failed to load report for file "${file}": ${error.message}</p>`;
      report.appendChild(errorWrapper);
    }
  }
}

renderReport();
