import { withGitHubApi } from "./github";

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
  async (filter, filters) => {
    return [];
  }
);

// Return an array of records from a paginated list of import candidates.
aha.on(
  {
    import: "aha-develop.github-import.issues",
    action: "listCandidates",
  },
  async (filters, page) => {
    console.log("filters", filters);

    const repoRegExp = new RegExp("^https://github.com/([^/]+)/([^/]+)");
    const match = repoRegExp.exec(filters.repo);
    let results = [];

    if (match) {
      const repo = `${match[1]}/${match[2]}`;
      console.log("repo", repo);

      await withGitHubApi(async (api) => {
        const { search } = await api(`
   {
      search(query:"type:issue repo:\\"${repo}\\"", type: ISSUE, first:20 ) {
        nodes {
          __typename
          ... on Issue {
            id
            number
            title
            url
            state
          }
        }
      }
    }
`);

        results = search.nodes.map((result) => ({
          id: result.id,
          identifier: "#" + result.number,
          name: result.title,
          url: result.url,
        }));
      });
    } else {
      console.log("no match");
    }

    return results;
  }
);

// Render a single record.
aha.on(
  { import: "aha-develop.github-import.issues", action: "renderRecord" },
  (record, element) => {
    return `${record.identifier}<br /><a href="${record.url}">${record.name}</a>`;
  }
);

// Prepare a single record for import.
aha.on(
  { import: "aha-develop.github-import.issues", action: "importRecord" },
  async (record, { teamId }) => {
    // Add `record` to Aha!, potentially making API calls to the other system to fetch more information as necessary.
    const feature = new aha.models.Feature({
      name: record.name,
      team: { id: teamId },
    });

    await feature.save();

    return feature;
  }
);
