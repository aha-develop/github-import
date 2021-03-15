import { withGitHubApi, autocompleteRepo, findIssues } from "./github";

// Return a list of the possible filters.
aha.on(
  { import: "aha-develop.github-import.issues", action: "listFilters" },
  () => {
    return {
      repo: {
        title: "Repository",
        required: true,
        type: "text",
      },
    };
  }
);

// For a particular filter, when it is dropped-down, provide a list of the possible values.
aha.on(
  { import: "aha-develop.github-import.issues", action: "filterValues" },
  async ({ filter, filters }) => {
    let values = [];
    switch (filter) {
      case "repo":
        values = await autocompleteRepo(filters.repo);
    }
    return values;
  }
);

// Return an array of records from a paginated list of import candidates.
aha.on(
  {
    import: "aha-develop.github-import.issues",
    action: "listCandidates",
  },
  async ({ filters, nextPage }) => {
    return findIssues(filters.repo, nextPage);
  }
);

// Render a single record.
aha.on(
  { import: "aha-develop.github-import.issues", action: "renderRecord" },
  ({ record, element }) => {
    return `${record.identifier}<br /><a href="${record.url}" target="_blank" rel="noopener">${record.name}</a>`;
  }
);

// Prepare a single record for import.
aha.on(
  { import: "aha-develop.github-import.issues", action: "importRecord" },
  async ({ importRecord, ahaRecord }) => {
    ahaRecord.name = "[GitHub] " + ahaRecord.name;
    await ahaRecord.save();
  }
);
