import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Octokit } from "@octokit/rest";

export async function POST(request: Request) {
  const { repoName, files } = await request.json();

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const octokit = new Octokit({
    auth: session.provider_token,
  });

  try {
    // Create a new repository
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
    });

    const owner = repo.owner.login;

    // Create blobs for each file
    const fileBlobs = await Promise.all(
      files.map(async (file: any) => {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo: repoName,
          content: file.content,
          encoding: "utf-8",
        });
        return {
          path: file.path,
          sha: blob.sha,
          mode: "100644",
          type: "blob",
        };
      })
    );

    // Create a new tree with the new file blobs
    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo: repoName,
      tree: fileBlobs,
    });

    // Create a new commit with the new tree
    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo: repoName,
      message: "Initial commit from Sokarr.ai",
      tree: newTree.sha,
    });

    // Update the main branch to point to the new commit
    await octokit.git.updateRef({
      owner,
      repo: repoName,
      ref: "heads/main",
      sha: newCommit.sha,
    });

    return NextResponse.json({ success: true, repoUrl: repo.html_url });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to export to GitHub" }, { status: 500 });
  }
}
