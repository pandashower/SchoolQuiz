import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Loader2, X } from "lucide-react";

type Question = {
  id: number;
  question: string;
  answers: Record<string, string>;
  correct: Record<string, boolean>;
};

type AnswerKey = "A" | "B" | "C" | "D";

const QuizApp = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswers, setNewAnswers] = useState<Record<AnswerKey, string>>({ A: "", B: "", C: "", D: "" });
  const [correctAnswers, setCorrectAnswers] = useState<Record<AnswerKey, boolean>>({ A: false, B: false, C: false, D: false });
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
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      toast({ title: "Pytanie zostało dodane pomyślnie" });
      setNewQuestion("");
      setNewAnswers({ A: "", B: "", C: "", D: "" });
      setCorrectAnswers({ A: false, B: false, C: false, D: false });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Nie udało się dodać pytania", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const addQuestion = () => {
    const validAnswers = Object.entries(newAnswers).filter(([_, value]) => value.trim() !== "");
    if (newQuestion.trim() && validAnswers.length > 0 && Object.values(correctAnswers).some((v) => v)) {
      addQuestionMutation.mutate({
        question: newQuestion,
        answers: newAnswers,
        correct: correctAnswers,
      });
    } else {
      toast({
        title: "Nieprawidłowe dane",
        description: "Upewnij się, że wypełniłeś pytanie, przynajmniej jedną odpowiedź i zaznaczyłeś poprawną odpowiedź.",
        variant: "destructive"
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

  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/questions'] });
      toast({ title: "Pytanie zostało usunięte" });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Nie udało się usunąć pytania", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleDeleteQuestion = (id: number) => {
    if (window.confirm('Czy na pewno chcesz usunąć to pytanie?')) {
      deleteQuestionMutation.mutate(id);
    }
  };

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
              <h2 className="text-xl font-semibold mb-4">Dodaj nowe pytanie</h2>
              <Input
                placeholder="Wpisz pytanie"
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                className="mb-4"
              />
              {(["A", "B", "C", "D"] as const).map((option) => (
                <div key={option} className="mb-4 flex items-center gap-4">
                  <Input
                    placeholder={`Odpowiedź ${option}`}
                    value={newAnswers[option]}
                    onChange={(e) => setNewAnswers({ ...newAnswers, [option]: e.target.value })}
                    className="flex-1"
                  />
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={correctAnswers[option]}
                      onCheckedChange={(checked) => setCorrectAnswers({ ...correctAnswers, [option]: !!checked })}
                    />
                    <label>Poprawna</label>
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
                Dodaj pytanie
              </Button>
            </CardContent>
          </Card>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Dostępne pytania ({questions.length})</h2>
              <ul className="space-y-2">
                {questions.map((q) => (
                  <li key={q.id} className="p-2 bg-secondary rounded-md flex justify-between items-center">
                    <span>{q.question}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteQuestion(q.id)}
                      className="h-8 w-8"
                      disabled={deleteQuestionMutation.isPending}
                    >
                      {deleteQuestionMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold mb-4">Rozpocznij Quiz</h2>
              <div className="mb-4">
                <label className="block mb-2">Liczba pytań:</label>
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
                Rozpocznij Quiz
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
                      ? "Poprawna odpowiedź!"
                      : `Niepoprawna odpowiedź! Poprawne odpowiedzi to: ${Object.entries(q.correct)
                          .filter(([_, value]) => value)
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
                <h2 className="text-xl font-bold mb-2">Quiz zakończony!</h2>
                <p className="mb-4">
                  Zdobyłeś {correctAnswersCount} z {quizQuestions.length} punktów (
                  {((correctAnswersCount / quizQuestions.length) * 100).toFixed(2)}%)
                </p>
                <Button onClick={restartQuiz} className="w-full">
                  Rozpocznij nowy Quiz
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