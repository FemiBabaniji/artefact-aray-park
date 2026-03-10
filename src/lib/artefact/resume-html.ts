// ════════════════════════════════════════════════════════════════════════════
// P3: Resume HTML Template
// Generates clean, printable HTML for PDF export
// ════════════════════════════════════════════════════════════════════════════

import type { ResumeOutput } from "./output";

export function generateResumeHTML(resume: ResumeOutput): string {
  const { identity, summary, experience, education, skills, certifications, projects } = resume;

  const formatDate = (date?: string) => {
    if (!date) return "";
    try {
      return new Date(date).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    } catch {
      return date;
    }
  };

  const skillsByCategory = skills.reduce<Record<string, string[]>>((acc, skill) => {
    const cat = skill.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(skill.name);
    return acc;
  }, {});

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${identity.name} - Resume</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #1a1a1a;
      max-width: 8.5in;
      margin: 0 auto;
      padding: 0.5in;
    }
    @media print {
      body {
        padding: 0;
      }
    }
    header {
      text-align: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #333;
    }
    h1 {
      font-size: 24pt;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }
    .title {
      font-size: 12pt;
      color: #555;
      margin-bottom: 0.5rem;
    }
    .contact {
      font-size: 10pt;
      color: #666;
    }
    .contact a {
      color: #0066cc;
      text-decoration: none;
    }
    section {
      margin-bottom: 1.25rem;
    }
    h2 {
      font-size: 12pt;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #333;
      border-bottom: 1px solid #ddd;
      padding-bottom: 0.25rem;
      margin-bottom: 0.75rem;
    }
    .entry {
      margin-bottom: 0.75rem;
    }
    .entry-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 0.25rem;
    }
    .entry-title {
      font-weight: 600;
    }
    .entry-org {
      color: #555;
    }
    .entry-date {
      font-size: 10pt;
      color: #666;
      white-space: nowrap;
    }
    .entry-location {
      font-size: 10pt;
      color: #666;
    }
    ul {
      margin-left: 1.25rem;
      margin-top: 0.25rem;
    }
    li {
      margin-bottom: 0.15rem;
    }
    .skills-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem 1.5rem;
    }
    .skill-category {
      font-weight: 600;
      margin-right: 0.25rem;
    }
    .summary {
      font-style: italic;
      color: #444;
    }
    .projects-list {
      display: grid;
      gap: 0.5rem;
    }
    .project {
      display: flex;
      gap: 0.5rem;
    }
    .project-title {
      font-weight: 600;
    }
    .project-desc {
      color: #555;
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(identity.name)}</h1>
    ${identity.title ? `<div class="title">${escapeHtml(identity.title)}</div>` : ""}
    <div class="contact">
      ${[
        identity.email,
        identity.location,
        ...identity.links.map((l) => `<a href="${escapeHtml(l.url)}">${escapeHtml(l.label)}</a>`),
      ]
        .filter(Boolean)
        .join(" | ")}
    </div>
  </header>

  ${
    summary
      ? `
  <section>
    <h2>Summary</h2>
    <p class="summary">${escapeHtml(stripHtml(summary))}</p>
  </section>
  `
      : ""
  }

  ${
    experience.length > 0
      ? `
  <section>
    <h2>Experience</h2>
    ${experience
      .map(
        (exp) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <span class="entry-title">${escapeHtml(exp.title)}</span>
            <span class="entry-org"> at ${escapeHtml(exp.organization)}</span>
            ${exp.location ? `<span class="entry-location"> — ${escapeHtml(exp.location)}</span>` : ""}
          </div>
          <span class="entry-date">${formatDate(exp.startDate)} — ${exp.current ? "Present" : formatDate(exp.endDate)}</span>
        </div>
        ${
          exp.highlights.length > 0
            ? `
          <ul>
            ${exp.highlights.map((h) => `<li>${escapeHtml(h)}</li>`).join("")}
          </ul>
        `
            : ""
        }
      </div>
    `
      )
      .join("")}
  </section>
  `
      : ""
  }

  ${
    education.length > 0
      ? `
  <section>
    <h2>Education</h2>
    ${education
      .map(
        (edu) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <span class="entry-title">${escapeHtml(edu.institution)}</span>
            ${edu.degree ? `<span class="entry-org"> — ${escapeHtml(edu.degree)}${edu.field ? ` in ${escapeHtml(edu.field)}` : ""}</span>` : ""}
          </div>
          ${edu.endDate || edu.startDate ? `<span class="entry-date">${formatDate(edu.startDate)}${edu.endDate ? ` — ${formatDate(edu.endDate)}` : ""}</span>` : ""}
        </div>
      </div>
    `
      )
      .join("")}
  </section>
  `
      : ""
  }

  ${
    Object.keys(skillsByCategory).length > 0
      ? `
  <section>
    <h2>Skills</h2>
    <div class="skills-grid">
      ${Object.entries(skillsByCategory)
        .map(
          ([category, names]) => `
        <div><span class="skill-category">${escapeHtml(category)}:</span> ${names.map(escapeHtml).join(", ")}</div>
      `
        )
        .join("")}
    </div>
  </section>
  `
      : ""
  }

  ${
    certifications.length > 0
      ? `
  <section>
    <h2>Certifications</h2>
    ${certifications
      .map(
        (cert) => `
      <div class="entry">
        <div class="entry-header">
          <div>
            <span class="entry-title">${escapeHtml(cert.name)}</span>
            <span class="entry-org"> — ${escapeHtml(cert.issuer)}</span>
          </div>
          ${cert.date ? `<span class="entry-date">${formatDate(cert.date)}</span>` : ""}
        </div>
      </div>
    `
      )
      .join("")}
  </section>
  `
      : ""
  }

  ${
    projects.length > 0
      ? `
  <section>
    <h2>Projects</h2>
    <div class="projects-list">
      ${projects
        .map(
          (proj) => `
        <div class="project">
          <span class="project-title">${escapeHtml(proj.title)}${proj.url ? ` (<a href="${escapeHtml(proj.url)}">link</a>)` : ""}</span>
          ${proj.description ? `<span class="project-desc">— ${escapeHtml(proj.description)}</span>` : ""}
        </div>
      `
        )
        .join("")}
    </div>
  </section>
  `
      : ""
  }
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}
