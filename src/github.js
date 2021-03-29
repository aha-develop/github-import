import { graphql } from "https://cdn.skypack.dev/@octokit/graphql";

const AUTOCOMPLETE_USERS = `
  query searchUsers($userQuery: String!) {
    search(query: $userQuery, type: USER, first:10 ) {
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
`;

const AUTOCOMPLETE_REPOS = `
 query searchRepos($repoQuery: String!) {
    search(query: $repoQuery, type: REPOSITORY, first:10 ) {
      nodes {
        __typename
        ... on Repository {
          nameWithOwner
        }
      }
    }
  }
`;

const SEARCH_ISSUES = `
  query searchIssues($issueQuery: String!, $cursor: String) {
    search(query:$issueQuery, type: ISSUE, first:20, after:$cursor ) {
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
`;

export async function githubGraphQL() {
  const authData = await aha.auth("github", {
    useCachedRetry: true,
    parameters: { scope: "repo, read:org" },
  });
  const graphqlWithAuth = graphql.defaults({
    headers: {
      authorization: `token ${authData.token}`,
    },
  });

  return graphqlWithAuth;
}

export async function autocompleteRepo(query) {
  let results = [];
  if (!query || query.length < 3) return results;

  const [owner, repo] = query.split("/");
  if (repo === undefined) {
    const api = await githubGraphQL();

    const { search } = await api(AUTOCOMPLETE_USERS, {
      userQuery: owner,
    });

    results = search.nodes
      .filter((result) => result.login)
      .map((result) => ({
        value: result.login + "/",
      }));
  } else {
    const api = await githubGraphQL();
    const { search } = await api(AUTOCOMPLETE_REPOS, {
      repoQuery: `user:${owner} ${repo}`,
    });

    results = search.nodes.map((result) => ({
      value: result.nameWithOwner,
    }));
  }
  return results;
}

export async function findIssues(repoWithOwner, cursor) {
  let records = [];
  let nextPage = null;
  if (!repoWithOwner) return { records, nextPage };

  const [owner, repo] = repoWithOwner.split("/");
  if (!repo) return { records, nextPage };

  const api = await githubGraphQL();
  const { search } = await api(SEARCH_ISSUES, {
    issueQuery: `type:issue repo:"${repoWithOwner}"`,
    cursor,
  });

  records = search.nodes.map((result) => ({
    uniqueId: result.id,
    identifier: "#" + result.number,
    name: result.title,
    url: result.url,
  }));
  nextPage = search.pageInfo.endCursor;

  return { records, nextPage };
}
