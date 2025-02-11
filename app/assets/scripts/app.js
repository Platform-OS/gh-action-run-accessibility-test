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
      ${rules.length === 0 ? `<p>No ${title.toLowerCase()} found.</p>` : createReportTable(rules, id)}
    </div>
  `;

  // Add event listener for collapsible behavior
  const header = section.querySelector(".collapsible");
  const content = section.querySelector(".content");
  const indicator = section.querySelector(".indicator");

  header.addEventListener("click", (event) => {
    if (event.target.closest("table")) {
      return;
    }
    const isHidden = content.style.display === "none";
    content.style.display = isHidden ? "block" : "none";
    header.classList.toggle("active", isHidden);
    indicator.textContent = isHidden ? "▼" : "►";
  });

  return section;
}

function createReportTable(issues) {
  const table = document.createElement("table");
  table.className = "modern-table";

  // Create table header
  table.innerHTML = `
        <thead>
            <tr>
                <th>ID</th>
                <th>Description</th>
                <th>Impact</th>
                <th>Help</th>
                <th>Affected Elements</th>
            </tr>
        </thead>
        <tbody>
        </tbody>
    `;

  const tbody = table.querySelector("tbody");

  // Populate table rows
  issues.forEach(issue => {
    const row = document.createElement("tr");

    row.innerHTML = `
            <td>${escapeHTML(issue.id)}</td>
            <td>${escapeHTML(issue.description)}</td>
            <td class="${issue.impact ? issue.impact.toLowerCase() : "info"}">${escapeHTML(issue.impact || "N/A")}</td>
            <td><a href="${issue.helpUrl}" target="_blank">${escapeHTML(issue.help)}</a></td>
            <td>
                <details>
                    <summary>${issue.nodes.length} elements affected</summary>
                    ${issue.nodes.map(node => `<pre>${escapeHTML(node.html)}</pre>`).join('')}
                </details>
            </td>
        `;

    tbody.appendChild(row);
  });

  return table.outerHTML;
}

async function renderReport() {
  const report = document.getElementById("reports");
  const reportFiles = jsonFiles;

  report.innerHTML = ""; // Clear existing content

  for (const file of reportFiles) {
    try {
      const data = await loadJSON(file);
      const pageName = file.match(/(\w+)-accessibility-scan-results\.json/)[1]; // Extract page name

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
      reportWrapper.id = `report-wrapper-${pageName}`;

      // Create collapsible heading
      const heading = document.createElement("h2");
      heading.className = "collapsible-report";
      heading.innerHTML = `<span class="indicator">▼</span> Report for ${pageName} page`;

      // Create content div that holds the sections
      const contentDiv = document.createElement("div");
      contentDiv.className = "report-content";

      // Add sections for this file
      contentDiv.appendChild(createSection("Violations", sectionData.violations, "violations", true));
      contentDiv.appendChild(createSection("Incomplete", sectionData.incomplete, "incomplete"));
      contentDiv.appendChild(createSection("Passes", sectionData.passes, "passes"));
      contentDiv.appendChild(createSection("Inapplicable", sectionData.inapplicable, "inapplicable"));

      // Append the heading and contentDiv to the reportWrapper
      reportWrapper.appendChild(heading);
      reportWrapper.appendChild(contentDiv);

      // Append the wrapper to the main report container
      report.appendChild(reportWrapper);

      // Add click event for collapsibility
      heading.addEventListener("click", () => {
        const isHidden = contentDiv.style.display === "none";
        contentDiv.style.display = isHidden ? "block" : "none";
        heading.classList.toggle("active", isHidden);
        heading.querySelector(".indicator").textContent = isHidden ? "▼" : "►";
      });

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

