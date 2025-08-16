import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { Octokit } from "@octokit/rest";

export async function GET(request: Request) {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);

  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const octokit = new Octokit({
    auth: session.provider_token,
  });

  const { data: repos } = await octokit.repos.listForAuthenticatedUser();

  return NextResponse.json(repos);
}
