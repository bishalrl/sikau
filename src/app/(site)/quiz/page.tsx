"use client";

import { useState } from "react";
import { CheckCircle2, Flame, Star, XCircle, Zap } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { quizQuestions } from "@/lib/data";

export default function QuizPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [xp, setXp] = useState(0);

  const question = quizQuestions[currentIndex];
  const progress = ((currentIndex + (answered ? 1 : 0)) / quizQuestions.length) * 100;

  function handleSelect(index: number) {
    if (answered) return;
    setSelected(index);
    setAnswered(true);
    if (index === question.correctIndex) {
      setScore((s) => s + 1);
      setXp((x) => x + 50);
    }
  }

  function handleNext() {
    if (currentIndex < quizQuestions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      setFinished(true);
    }
  }

  if (finished) {
    const pct = Math.round((score / quizQuestions.length) * 100);
    return (
      <div className="site-container py-xl text-center">
        <Card className="p-8">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-container/10">
            <TrophyIcon pct={pct} />
          </div>
          <h1 className="mt-6 font-display-md text-display-md text-on-background">Quiz Complete!</h1>
          <p className="mt-sm font-body-md text-on-surface-variant">
            You scored {score}/{quizQuestions.length} ({pct}%)
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Badge variant="gold">+{xp} XP earned</Badge>
            <Badge variant="emerald">
              <Flame className="mr-1 h-3 w-3" /> Streak maintained
            </Badge>
          </div>
          <div className="mt-8 flex flex-col gap-3">
            <Button
              onClick={() => {
                setCurrentIndex(0);
                setSelected(null);
                setAnswered(false);
                setScore(0);
                setXp(0);
                setFinished(false);
              }}
            >
              Play Again
            </Button>
            <Button variant="secondary" href="/dashboard">
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="site-container py-xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <Badge variant="emerald" className="mb-2">
            Gamified Quiz
          </Badge>
          <h1 className="font-display-md text-display-md text-on-background">Daily Finance Challenge</h1>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="gold">
            <Zap className="mr-1 h-3 w-3" /> {xp} XP
          </Badge>
          <Badge variant="emerald">
            <Flame className="mr-1 h-3 w-3" /> 12 day streak
          </Badge>
        </div>
      </div>

      <ProgressBar value={progress} className="mb-6" />

      <Card className="p-6 sm:p-8">
        <p className="font-label-md text-primary">
          Question {currentIndex + 1} of {quizQuestions.length}
        </p>
        <h2 className="mt-sm font-headline-md text-on-background">{question.question}</h2>
        <p className="mt-xs font-body-md text-on-surface-variant">{question.questionNe}</p>

        <div className="mt-6 space-y-3">
          {question.options.map((option, i) => {
            let style =
              "border-outline-variant/40 hover:border-primary/40 hover:bg-primary-container/10";
            if (answered && i === question.correctIndex) {
              style = "border-primary bg-primary-container/10 ring-2 ring-primary/40";
            } else if (answered && i === selected && i !== question.correctIndex) {
              style = "border-red-400 bg-red-50 ring-2 ring-red-400";
            } else if (selected === i) {
              style = "border-primary bg-primary-container/10";
            }

            return (
              <button
                key={option}
                onClick={() => handleSelect(i)}
                disabled={answered}
                className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left text-sm font-medium transition-all ${style}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-surface-container text-xs font-bold text-on-surface-variant">
                  {String.fromCharCode(65 + i)}
                </span>
                {option}
                {answered && i === question.correctIndex && (
                  <CheckCircle2 className="ml-auto h-5 w-5 text-primary" />
                )}
                {answered && i === selected && i !== question.correctIndex && (
                  <XCircle className="ml-auto h-5 w-5 text-red-500" />
                )}
              </button>
            );
          })}
        </div>

        {answered && (
          <div className="mt-6 rounded-xl bg-surface-container-low p-4">
            <p className="font-body-md font-semibold text-on-background">
              {selected === question.correctIndex ? "✅ Correct!" : "❌ Not quite"}
            </p>
            <p className="mt-xs font-body-md text-on-surface-variant">{question.explanation}</p>
            {selected === question.correctIndex && (
              <Badge variant="gold" className="mt-3">
                <Star className="mr-1 h-3 w-3" /> +50 XP
              </Badge>
            )}
          </div>
        )}

        {answered && (
          <Button onClick={handleNext} className="mt-6 w-full">
            {currentIndex < quizQuestions.length - 1 ? "Next Question" : "See Results"}
          </Button>
        )}
      </Card>
    </div>
  );
}

function TrophyIcon({ pct }: { pct: number }) {
  if (pct >= 80) return <span className="text-4xl">🏆</span>;
  if (pct >= 60) return <span className="text-4xl">⭐</span>;
  return <span className="text-4xl">📚</span>;
}
