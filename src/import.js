import { autocompleteRepo, findIssues } from "./github";

const importer = aha.getImporter("aha-develop.github-import.issues");

// Return a list of the possible filters.
importer.on({ action: "listFilters" }, () => {
  return {
    repo: {
      title: "Repository",
      required: true,
      type: "text",
    },
  };
});

// For a particular filter, when it is dropped-down, provide a list of the possible values.
importer.on({ action: "filterValues" }, async ({ filterName, filters }) => {
  let values = [];
  switch (filterName) {
    case "repo":
      values = await autocompleteRepo(filters.repo);
  }
  return values;
});

// Return an array of records from a paginated list of import candidates.
importer.on({ action: "listCandidates" }, async ({ filters, nextPage }) => {
  return findIssues(filters.repo, nextPage);
});

// Render a single record.
importer.on({ action: "renderRecord" }, ({ record, element }) => {
  return `${record.identifier}<br /><a href="${record.url}" target="_blank" rel="noopener">${record.name}</a>`;
});

// Prepare a single record for import.
importer.on({ action: "importRecord" }, async ({ importRecord, ahaRecord }) => {
  ahaRecord.name = "[GitHub] " + ahaRecord.name;
  await ahaRecord.save();
});
