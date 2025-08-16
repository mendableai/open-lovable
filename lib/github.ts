import { Octokit } from "@octokit/rest";

export async function getRepoContents(
  octokit: Octokit,
  owner: string,
  repo: string,
  path: string = ""
) {
  const { data: contents } = await octokit.repos.getContents({
    owner,
    repo,
    path,
  });

  const files = [];
  for (const item of contents) {
    if (item.type === "file") {
      const { data: file } = await octokit.git.getBlob({
        owner,
        repo,
        file_sha: item.sha,
      });
      files.push({
        path: item.path,
        content: Buffer.from(file.content, "base64").toString("utf-8"),
      });
    } else if (item.type === "dir") {
      const subFiles = await getRepoContents(octokit, owner, repo, item.path);
      files.push(...subFiles);
    }
  }

  return files;
}
