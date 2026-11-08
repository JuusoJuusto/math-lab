/**
 * The multiple-choice question bank used by practice rounds.
 *
 * Every question belongs to a topic (see content/topics.ts) and has exactly one
 * correct answer, which must also appear in `choices`. The tests in
 * content/__tests__ check this, and also solve every "Solve the equation"
 * prompt to prove that the answer key is mathematically right.
 */

export type QuestionLevel = "Beginner" | "Intermediate" | "Advanced";

export interface Question {
  id: string;
  topic: string;
  level: QuestionLevel;
  prompt: string;
  choices: string[];
  answer: string;
  explanation: string;
}

export const questions: Question[] = [
  {
    id: "q1",
    topic: "one-step",
    level: "Beginner",
    prompt: "Solve the equation:  x + 7 = 15",
    choices: ["x = 8", "x = 22", "x = 7", "x = 9"],
    answer: "x = 8",
    explanation: "Subtract 7 from both sides: x = 15 − 7 = 8.",
  },
  {
    id: "q2",
    topic: "one-step",
    level: "Beginner",
    prompt: "Solve the equation:  4x = 28",
    choices: ["x = 24", "x = 7", "x = 32", "x = 6"],
    answer: "x = 7",
    explanation: "Divide both sides by 4: x = 28 / 4 = 7.",
  },
  {
    id: "q3",
    topic: "one-step",
    level: "Beginner",
    prompt: "Solve the equation:  x − 9 = 4",
    choices: ["x = −5", "x = 13", "x = 36", "x = 5"],
    answer: "x = 13",
    explanation: "Add 9 to both sides: x = 4 + 9 = 13.",
  },
  {
    id: "q13",
    topic: "one-step",
    level: "Beginner",
    prompt: "Solve the equation:  x / 5 = 4",
    choices: ["x = 20", "x = 9", "x = 1", "x = 0.8"],
    answer: "x = 20",
    explanation: "x is divided by 5, so multiply both sides by 5: x = 4 × 5 = 20.",
  },
  {
    id: "q14",
    topic: "two-step",
    level: "Intermediate",
    prompt: "Solve the equation:  2x + 5 = 17",
    choices: ["x = 6", "x = 12", "x = 11", "x = 8.5"],
    answer: "x = 6",
    explanation: "Subtract 5 from both sides: 2x = 12. Then divide both sides by 2: x = 6.",
  },
  {
    id: "q15",
    topic: "two-step",
    level: "Intermediate",
    prompt: "Solve the equation:  3x − 4 = 20",
    choices: ["x = 8", "x = 24", "x = 16", "x = 7"],
    answer: "x = 8",
    explanation: "Add 4 to both sides: 3x = 24. Then divide both sides by 3: x = 8.",
  },
  {
    id: "q16",
    topic: "two-step",
    level: "Intermediate",
    prompt: "Solve the equation:  x / 3 + 4 = 9",
    choices: ["x = 15", "x = 5", "x = 39", "x = 13"],
    answer: "x = 15",
    explanation: "Subtract 4 from both sides: x / 3 = 5. Then multiply both sides by 3: x = 15.",
  },
  {
    id: "q17",
    topic: "two-step",
    level: "Intermediate",
    prompt: "Solve the equation:  5x + 2 = 27",
    choices: ["x = 5", "x = 25", "x = 29", "x = 6"],
    answer: "x = 5",
    explanation: "Subtract 2 from both sides: 5x = 25. Then divide both sides by 5: x = 5.",
  },
  {
    id: "q4",
    topic: "both",
    level: "Intermediate",
    prompt: "Solve the equation:  5x + 2 = 3x + 12",
    choices: ["x = 5", "x = 7", "x = 10", "x = 2"],
    answer: "x = 5",
    explanation: "Subtract 3x and 2: 2x = 10. Divide by 2: x = 5.",
  },
  {
    id: "q5",
    topic: "both",
    level: "Intermediate",
    prompt: "Solve the equation:  7x − 4 = 4x + 11",
    choices: ["x = 3", "x = 5", "x = 7", "x = 15"],
    answer: "x = 5",
    explanation: "Subtract 4x and add 4: 3x = 15, so x = 5.",
  },
  {
    id: "q6",
    topic: "brackets",
    level: "Intermediate",
    prompt: "Solve the equation:  2(x + 3) = 18",
    choices: ["x = 6", "x = 9", "x = 12", "x = 3"],
    answer: "x = 6",
    explanation: "Expand the brackets: 2x + 6 = 18. Subtract 6, then divide by 2: x = 6.",
  },
  {
    id: "q7",
    topic: "brackets",
    level: "Advanced",
    prompt: "Solve the equation:  3(x − 2) = 2x + 5",
    choices: ["x = 9", "x = 11", "x = 7", "x = 1"],
    answer: "x = 11",
    explanation: "Expand the brackets: 3x − 6 = 2x + 5. Subtract 2x and add 6: x = 11.",
  },
  {
    id: "q8",
    topic: "proportion",
    level: "Beginner",
    prompt: "2 kg of apples cost €6. How much do 5 kg cost at the same price per kilogram?",
    choices: ["10 €", "12 €", "15 €", "18 €"],
    answer: "15 €",
    explanation: "One kilogram costs €6 / 2 = €3. Five kilograms cost 5 × €3 = €15.",
  },
  {
    id: "q9",
    topic: "proportion",
    level: "Intermediate",
    prompt: "On a map, 1 cm represents 4 km. What distance does 3.5 cm represent?",
    choices: ["7 km", "12 km", "14 km", "16 km"],
    answer: "14 km",
    explanation: "Distance is directly proportional to map length: 3.5 × 4 km = 14 km.",
  },
  {
    id: "q10",
    topic: "word",
    level: "Intermediate",
    prompt: "Three identical pens cost €6 in total. What is the price of one pen?",
    choices: ["1 €", "2 €", "3 €", "6 €"],
    answer: "2 €",
    explanation: "Let x be the price of one pen: 3x = 6. Divide by three to get x = €2.",
  },
  {
    id: "q11",
    topic: "basics",
    level: "Beginner",
    prompt: "Which of the following is an equation?",
    choices: ["3x + 2", "3x + 2 = 11", "x > 4", "2 + 5"],
    answer: "3x + 2 = 11",
    explanation: "An equation has an equals sign and two expressions with the same value.",
  },
  {
    id: "q12",
    topic: "proportion",
    level: "Advanced",
    prompt: "Four workers complete a job in 12 hours. How long would eight workers take at the same rate?",
    choices: ["3 hours", "6 hours", "12 hours", "24 hours"],
    answer: "6 hours",
    explanation:
      "The number of workers and the time are inversely proportional. Doubling the workforce halves the time: 12 / 2 = 6 hours.",
  },
];

/** The questions that belong to a topic, or the whole bank for the mixed round. */
export function questionsFor(topicId: string): Question[] {
  return questions.filter((question) => topicId === "all" || question.topic === topicId);
}
