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
