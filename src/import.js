import { withGitHubApi, autocompleteRepo, findIssues } from "./github";

const gitHubIssuesImporter = {
  // Return a list of the possible filters.
  listFilters() {
    return {
      repo: {
        title: "Repository",
        required: true,
        type: "text",
      },
    };
  },

  // For a particular filter, provide a list of the possible values.
  async filterValues({ filterName, filters }) {
    let values = [];
    switch (filterName) {
      case "repo":
        values = await autocompleteRepo(filters.repo);
    }
    return values;
  },

  // Return an array of records from a paginated list of import candidates.
  async listCandidates({ filters, nextPage }) {
    return findIssues(filters.repo, nextPage);
  },

  // Render a single record.
  renderRecord({ record, element }) {
    return `${record.identifier}<br /><a href="${record.url}" target="_blank" rel="noopener">${record.name}</a>`;
  },

  // Update a single record following import
  async importRecord({ importRecord, ahaRecord }) {
    ahaRecord.name = "[GitHub] " + ahaRecord.name;
    await ahaRecord.save();
  },
};

aha.registerImporter("aha-develop.github-import.issues", gitHubIssuesImporter);
