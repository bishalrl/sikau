"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function LessonCompleteButton({
  lessonId,
  completed,
}: {
  lessonId: string;
  completed: boolean;
}) {
  const router = useRouter();
  const [done, setDone] = useState(completed);
  const [loading, setLoading] = useState(false);

  async function markComplete() {
    setLoading(true);
    const response = await fetch(`/api/lessons/${lessonId}/complete`, {
      method: "POST",
    });

    setLoading(false);
    if (response.ok) {
      setDone(true);
      router.refresh();
    }
  }

  return (
    <Button type="button" onClick={markComplete} disabled={done || loading}>
      {done ? "Completed" : loading ? "Saving..." : "Mark as Complete"}
    </Button>
  );
}
