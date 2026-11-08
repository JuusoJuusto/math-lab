/**
 * The topic catalogue.
 *
 * Topic ids are stable: they are stored in learners' browsers as progress, and
 * question ids refer to them. Topics that host an interactive solver level use
 * the same id as the level (see lib/equations/levels.ts).
 */

export type TopicColour = "blue" | "green" | "orange" | "purple" | "pink" | "teal";

export interface Topic {
  id: string;
  title: string;
  subtitle: string;
  colour: TopicColour;
  icon: string;
  description: string;
  lesson: string[];
}

export const topics: Topic[] = [
  {
    id: "basics",
    title: "Understanding equations",
    subtitle: "What does equality mean?",
    colour: "blue",
    icon: "⚖️",
    description: "Learn what an equation is and how to find an unknown value.",
    lesson: [
      "An equation says that its left-hand side and right-hand side have the same value.",
      "A letter such as x represents an unknown number.",
      "An equation stays balanced when you perform the same operation on both sides.",
      "The goal is to isolate x on one side of the equation.",
    ],
  },
  {
    id: "one-step",
    title: "One-step equations",
    subtitle: "Undo one operation to find x",
    colour: "green",
    icon: "🔎",
    description: "Use inverse operations to get x on its own, one step at a time.",
    lesson: [
      "Addition and subtraction undo each other: to undo + 5, subtract 5.",
      "Multiplication and division undo each other: to undo × 3, divide by 3.",
      "Do the same thing to both sides, so the equation stays balanced.",
      "Check your solution by substituting it into the original equation.",
    ],
  },
  {
    id: "two-step",
    title: "Two-step equations",
    subtitle: "Undo two operations, in order",
    colour: "teal",
    icon: "🪜",
    description: "Solve equations where x has been multiplied or divided and then had a number added or subtracted.",
    lesson: [
      "In 2x + 5, x is multiplied by 2 first, then 5 is added.",
      "Undo the operations in reverse order: subtract 5 first, then divide by 2.",
      "After each step, look at what is still attached to x.",
      "Check your solution by substituting it into the original equation.",
    ],
  },
  {
    id: "both",
    title: "Variables on both sides",
    subtitle: "Collect the variable terms",
    colour: "orange",
    icon: "↔️",
    description: "Move variable terms to one side and constants to the other.",
    lesson: [
      "Choose the side on which you want to keep x.",
      "Subtract the variable term from both sides to collect the x terms.",
      "Combine like terms, then solve the simpler equation.",
    ],
  },
  {
    id: "brackets",
    title: "Equations with brackets",
    subtitle: "Expand brackets correctly",
    colour: "purple",
    icon: "( )",
    description: "Practice the distributive property and expanding brackets.",
    lesson: [
      "Multiply every term inside the brackets by the factor outside.",
      "For example, 3(x + 2) = 3x + 6.",
      "Then solve the resulting equation as usual.",
    ],
  },
  {
    id: "proportion",
    title: "Proportional relationships",
    subtitle: "How quantities change together",
    colour: "pink",
    icon: "📈",
    description: "Explore direct and inverse proportion.",
    lesson: [
      "In direct proportion, two quantities change by the same factor.",
      "In inverse proportion, increasing one quantity decreases the other in a corresponding way.",
      "In direct proportion, the ratio y/x stays constant.",
    ],
  },
  {
    id: "word",
    title: "Word problems",
    subtitle: "Turn a situation into an equation",
    colour: "teal",
    icon: "💬",
    description: "Build and solve equations from everyday situations.",
    lesson: [
      "Read the problem and decide what the unknown x represents.",
      "Use the information in the problem to write an equation.",
      "Solve the equation and answer the question in a complete sentence.",
      "Check that your answer makes sense in the given situation.",
    ],
  },
];

export function getTopic(id: string): Topic | undefined {
  return topics.find((topic) => topic.id === id);
}
