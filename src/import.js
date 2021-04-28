import { autocompleteRepo, findIssues } from "./github";

const importer = aha.getImporter("aha-develop.github-import.issues");

// Return a list of the possible filters.
importer.on({ action: "listFilters" }, () => {
  return {
    repo: {
      title: "Repository",
      required: true,
      type: "autocomplete",
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
importer.on({ action: "renderRecord" }, ({ record, onUnmounted }) => {
  onUnmounted(() => {
    console.log("unmounting component for", record.uniqueId);
  });

  return (
    <div>
      {record.identifier}
      <br />
      <a href={`${record.url}`} target="_blank" rel="noopener noreferrer">
        {record.name}
      </a>
    </div>
  );
});

// Prepare a single record for import.
importer.on({ action: "importRecord" }, async ({ importRecord, ahaRecord }) => {
  ahaRecord.description = `${importRecord.description}<p><a href='${importRecord.url}'>View on GitHub</a></p>`;
  return ahaRecord.save();
});
