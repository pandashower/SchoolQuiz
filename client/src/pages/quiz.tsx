import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type Question = {
  id: number;
  question: string;
  answers: Record<string, string>;
  correct: Record<string, boolean>;
};

const QuizApp = () => {
  const { toast } = useToast();
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswers, setNewAnswers] = useState({ A: "", B: "", C: "", D: "" });
  const [correctAnswers, setCorrectAnswers] = useState({ A: false, B: false, C: false, D: false });
  const [quizStarted, setQuizStarted] = useState(false);
  const [quizSize, setQuizSize] = useState(5);
  const [userAnswers, setUserAnswers] = useState<Array<{ index: number; isCorrect: boolean }>>([]);
  const [quizQuestions, setQuizQuestions] = useState<Question[]>([]);

  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ['/api/questions'],
  });

  const addQuestionMutation = useMutation({
    mutationFn: async (questionData: Omit<Question, 'id'>) => {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(questionData),
      });
      if (!response.ok) throw new Error('Failed to add question');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      toast({ title: "Question added successfully" });
      setNewQuestion("");
      setNewAnswers({ A: "", B: "", C: "", D: "" });
      setCorrectAnswers({ A: false, B: false, C: false, D: false });
    },
    onError: () => {
      toast({ title: "Failed to add question", variant: "destructive" });
    },
  });

  const addQuestion = () => {
    const validAnswers = Object.entries(newAnswers).filter(([key, value]) => value.trim() !== "");
    if (newQuestion.trim() && validAnswers.length > 0 && Object.values(correctAnswers).some((v) => v)) {
      addQuestionMutation.mutate({
        question: newQuestion,
        answers: newAnswers,
        correct: correctAnswers,
      });
    }
  };

  const startQuiz = () => {
    const shuffledQuestions = [...questions].sort(() => Math.random() - 0.5);
    setQuizQuestions(shuffledQuestions.slice(0, quizSize));
    setUserAnswers([]);
    setQuizStarted(true);
  };

  const handleAnswer = (index: number, selectedAnswer: string) => {
    const isCorrect = quizQuestions[index].correct[selectedAnswer];
    setUserAnswers([...userAnswers, { index, isCorrect }]);
  };

  const restartQuiz = () => {
    setQuizStarted(false);
    setQuizQuestions([]);
    setUserAnswers([]);
  };

  const correctAnswersCount = userAnswers.filter((a) => a.isCorrect).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Quiz App</h1>

      {!quizStarted ? (
        <div>
          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Add a Question</h2>
              <Input
                placeholder="Enter your question"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="mb-4"
              />
              {["A", "B", "C", "D"].map((option) => (
                <div key={option} className="mb-4 flex items-center gap-4">
                  <Input
                    placeholder={`Answer ${option}`}
                    value={newAnswers[option]}
                    onChange={(e) => setNewAnswers({ ...newAnswers, [option]: e.target.value })}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={correctAnswers[option]}
                      onCheckedChange={(checked) => setCorrectAnswers({ ...correctAnswers, [option]: !!checked })}
                    />
                    <label>Correct</label>
                  </div>
                </div>
              ))}
              <Button 
                onClick={addQuestion} 
                className="w-full"
                disabled={addQuestionMutation.isPending}
              >
                {addQuestionMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Add Question
              </Button>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Available Questions ({questions.length})</h2>
              <ul className="space-y-2">
                {questions.map((q, i) => (
                  <li key={i} className="p-2 bg-secondary rounded-md">{q.question}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Start Quiz</h2>
              <div className="mb-4">
                <label className="block mb-2">Number of questions:</label>
                <Input
                  type="number"
                  value={quizSize}
                  onChange={(e) => setQuizSize(Number(e.target.value))}
                  min={1}
                  max={questions.length}
                />
              </div>
              <Button 
                onClick={startQuiz} 
                disabled={questions.length === 0}
                className="w-full"
              >
                Start Quiz
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="space-y-4">
          {quizQuestions.map((q, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">{q.question}</h3>
                {userAnswers.some((a) => a.index === i) ? (
                  <p className={
                    userAnswers.find((a) => a.index === i)?.isCorrect
                      ? "text-green-600 font-medium"
                      : "text-red-600 font-medium"
                  }>
                    {userAnswers.find((a) => a.index === i)?.isCorrect
                      ? "Correct!"
                      : `Incorrect! The correct answers are: ${Object.entries(q.correct)
                          .filter(([key, value]) => value)
                          .map(([key]) => key)
                          .join(", ")}`}
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(q.answers).map(([key, value]) => (
                      <Button
                        key={key}
                        onClick={() => handleAnswer(i, key)}
                        variant="outline"
                        className="w-full"
                      >
                        {key}: {value}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}

          {userAnswers.length === quizQuestions.length && (
            <Card>
              <CardContent className="pt-6 text-center">
                <h2 className="text-xl font-bold mb-2">Quiz Completed!</h2>
                <p className="mb-4">
                  You got {correctAnswersCount} out of {quizQuestions.length} correct (
                  {((correctAnswersCount / quizQuestions.length) * 100).toFixed(2)}%)
                </p>
                <Button onClick={restartQuiz} className="w-full">
                  Start New Quiz
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default QuizApp;
