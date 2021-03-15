import { graphql } from "https://cdn.skypack.dev/@octokit/graphql";

export async function withGitHubApi(callback) {
  await aha.auth(
    "github",
    {
      useCachedRetry: true,
      parameters: { scope: "repo" },
    },
    async (authData) => {
      const graphqlWithAuth = graphql.defaults({
        headers: {
          authorization: `token ${authData.token}`,
        },
      });

      await callback(graphqlWithAuth);
    }
  );
}

export async function autocompleteRepo(query) {
  let results = [];
  if (!query || query.length < 3) return results;

  const [owner, repo] = query.split("/");
  if (repo === undefined) {
    await withGitHubApi(async (api) => {
      const { search } = await api(`
   {
      search(query:"${owner}", type: USER, first:10 ) {
        nodes {
          __typename
          ... on User {
            login
          }
          ... on Organization {
            login
          }
        }
      }
    }
`);

      results = search.nodes
        .filter((result) => result.login)
        .map((result) => ({
          value: result.login + "/",
        }));
    });
  } else {
    await withGitHubApi(async (api) => {
      const { search } = await api(`
   {
      search(query:"user:${owner} ${repo}", type: REPOSITORY, first:10 ) {
        nodes {
          __typename
          ... on Repository {
            nameWithOwner
          }
        }
      }
    }
`);

      results = search.nodes.map((result) => ({
        value: result.nameWithOwner,
      }));
    });
  }

  return results;
}

export async function findIssues(repoWithOwner, cursor) {
  let records = [];
  let nextPage = null;
  if (!repoWithOwner) return { records, nextPage };

  const [owner, repo] = repoWithOwner.split("/");
  if (!repo) return { records, nextPage };

  await withGitHubApi(async (api) => {
    const { search } = await api(`
   {
      search(query:"type:issue repo:\\"${repoWithOwner}\\"", type: ISSUE, first:20 ) {
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
        pageInfo {
          endCursor
        }
      }
    }
`);

    records = search.nodes.map((result) => ({
      id: result.id,
      identifier: "#" + result.number,
      name: result.title,
      url: result.url,
    }));
    nextPage = search.pageInfo.endCursor;
  });

  return { records, nextPage };
}
