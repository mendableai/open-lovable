'use client';

import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export default function ImportFromGithubModal({
  onClose,
  onImport,
}: {
  onClose: () => void;
  onImport: (repo: any) => void;
}) {
  const [repos, setRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const response = await fetch("/api/github/repos");
        const data = await response.json();
        setRepos(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRepos();
  }, []);

  return (
    <div className="bg-white rounded-lg p-8 w-[500px]">
      <h2 className="text-2xl font-bold mb-4">Import from GitHub</h2>
      {loading ? (
        <p>Loading repositories...</p>
      ) : (
        <ul className="space-y-2 max-h-96 overflow-y-auto">
          {repos.map((repo) => (
            <li key={repo.id} className="flex justify-between items-center">
              <span>{repo.full_name}</span>
              <Button onClick={() => onImport(repo)}>Import</Button>
            </li>
          ))}
        </ul>
      )}
      <Button onClick={onClose} className="mt-4">
        Close
      </Button>
    </div>
  );
}
