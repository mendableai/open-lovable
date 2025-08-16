import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Octokit } from "@octokit/rest";
import { getRepoContents } from "@/lib/github";

export async function POST(request: Request) {
  const { owner, repo } = await request.json();

  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const octokit = new Octokit({
    auth: session.provider_token,
  });

  const files = await getRepoContents(octokit, owner, repo);

  return NextResponse.json(files);
}
