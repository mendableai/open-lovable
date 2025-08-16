'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";

export default function ExportToGithubModal({
  onClose,
  onExport,
}: {
  onClose: () => void;
  onExport: (repoName: string) => void;
}) {
  const [repoName, setRepoName] = useState("");

  return (
    <div className="bg-white rounded-lg p-8 w-[500px]">
      <h2 className="text-2xl font-bold mb-4">Export to GitHub</h2>
      <Input
        placeholder="Repository name"
        value={repoName}
        onChange={(e) => setRepoName(e.target.value)}
      />
      <div className="flex justify-end space-x-2 mt-4">
        <Button onClick={onClose} variant="ghost">
          Cancel
        </Button>
        <Button onClick={() => onExport(repoName)}>Export</Button>
      </div>
    </div>
  );
}
