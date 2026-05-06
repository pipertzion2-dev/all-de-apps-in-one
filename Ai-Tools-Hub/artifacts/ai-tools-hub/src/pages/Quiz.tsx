import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Lightbulb, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { useGenerateQuiz } from "@workspace/api-client-react";

export default function QuizPage() {
  const [text, setText] = useState("");
  const { mutateAsync, data, isPending } = useGenerateQuiz();
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setAnswers({});
    setShowResults(false);
    await mutateAsync({ data: { text, count: 5 } });
  };

  const score = data?.questions.reduce((acc, q, i) => acc + (answers[i] === q.correctAnswer ? 1 : 0), 0) || 0;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Quiz Maker</h1>
            <p className="text-muted-foreground">Generate interactive study quizzes from any study material.</p>
          </div>
        </div>

        {!data ? (
          <Card className="border-white/5">
            <CardContent className="p-6">
              <Textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the educational content you want to be tested on..."
                className="min-h-[200px] mb-4"
              />
              <Button onClick={handleGenerate} disabled={isPending} className="w-full bg-rose-600 hover:bg-rose-700 text-white border-0 h-12">
                {isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                Generate 5 Question Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Your Quiz</h2>
              <Button variant="outline" onClick={() => { setText(""); mutateAsync({ data: { text: "", count: 0 } }).catch(()=>{}) }}>
                Create New
              </Button>
            </div>

            {data.questions.map((q, qIndex) => (
              <Card key={qIndex} className={`border-white/5 ${showResults && answers[qIndex] !== q.correctAnswer ? 'border-rose-500/50' : ''}`}>
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium text-white mb-4">{qIndex + 1}. {q.question}</h3>
                  <div className="space-y-3">
                    {q.options.map((opt, oIndex) => {
                      const isSelected = answers[qIndex] === oIndex;
                      const isCorrect = showResults && oIndex === q.correctAnswer;
                      const isWrong = showResults && isSelected && oIndex !== q.correctAnswer;
                      
                      return (
                        <button
                          key={oIndex}
                          disabled={showResults}
                          onClick={() => setAnswers(prev => ({ ...prev, [qIndex]: oIndex }))}
                          className={`w-full text-left p-4 rounded-xl border transition-all ${
                            isCorrect ? 'bg-emerald-500/20 border-emerald-500 text-emerald-100' :
                            isWrong ? 'bg-rose-500/20 border-rose-500 text-rose-100' :
                            isSelected ? 'bg-primary/20 border-primary text-white' :
                            'border-white/10 hover:border-white/30 text-muted-foreground hover:text-white bg-white/[0.02]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{opt}</span>
                            {isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                            {isWrong && <XCircle className="w-5 h-5 text-rose-400" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {showResults && (
                    <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10 text-sm text-muted-foreground">
                      <span className="font-semibold text-white">Explanation: </span>
                      {q.explanation}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}

            <div className="sticky bottom-8 mt-8 flex justify-center">
              {!showResults ? (
                <Button 
                  size="lg" 
                  className="shadow-2xl shadow-primary/50"
                  onClick={() => setShowResults(true)}
                  disabled={Object.keys(answers).length !== data.questions.length}
                >
                  Submit Answers
                </Button>
              ) : (
                <div className="bg-card border border-white/10 shadow-2xl rounded-2xl px-8 py-4 flex items-center gap-6">
                  <span className="text-xl font-bold text-white">Final Score:</span>
                  <span className={`text-3xl font-display font-bold ${score === data.questions.length ? 'text-emerald-400' : 'text-primary'}`}>
                    {score} / {data.questions.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
