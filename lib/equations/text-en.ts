import type { OperationKind } from "./operations";
import type { EngineText } from "./text-types";

const MINUS = "−";

/** "Adding 5 to both sides": the operation as the subject of a sentence. */
function gerund(kind: OperationKind, amount: string): string {
  switch (kind) {
    case "add":
      return `Adding ${amount} to both sides`;
    case "subtract":
      return `Subtracting ${amount} from both sides`;
    case "multiply":
      return `Multiplying both sides by ${amount}`;
    case "divide":
      return `Dividing both sides by ${amount}`;
  }
}

export const en: EngineText = {
  times: "×",
  divide: "÷",
  kindNames: { add: "Add", subtract: "Subtract", multiply: "Multiply", divide: "Divide" },
  modeNames: { balance: "Both sides", flip: "Flip a term", chain: "Work backwards" },

  phrase(kind, amount) {
    switch (kind) {
      case "add":
        return `add ${amount} to both sides`;
      case "subtract":
        return `subtract ${amount} from both sides`;
      case "multiply":
        return `multiply both sides by ${amount}`;
      case "divide":
        return `divide both sides by ${amount}`;
    }
  },

  speech(text) {
    return text
      .replace(/(\d|x)\/(\d)/g, "$1 over $2")
      .replace(/=/g, " equals ")
      .replace(new RegExp(MINUS, "g"), " minus ")
      .replace(/[×·]/g, " times ")
      .replace(/[÷:]/g, " divided by ")
      .replace(/\|/g, " both sides: ")
      .replace(/\+/g, " plus ")
      .replace(/\(\s+/g, "(")
      .replace(/\s+\)/g, ")")
      .replace(/\s+/g, " ")
      .trim();
  },

  problems: {
    "variable-multiplier": {
      title: "Use a plain number here",
      message:
        "Multiplying or dividing by something that contains x can change which values work, or even make a solution disappear. Multiply or divide by a number only.",
    },
    "divide-by-zero": {
      title: "You can't divide by zero",
      message: "Dividing by 0 has no answer, so it is never allowed. Choose a different number.",
    },
    "multiply-by-zero": {
      title: "Multiplying by zero loses information",
      message:
        "Multiplying both sides by 0 turns them both into 0, and 0 = 0 is true for every x. The equation would no longer tell you anything about x, so this move is not allowed.",
    },
    "too-large": {
      title: "That number gets too big",
      message: "The numbers in this step would become too large to handle. Try a smaller number.",
    },
    "not-equivalent": {
      title: "That would change the equation",
      message: "This step would not keep both sides balanced, so it is not allowed.",
    },
  },

  check: {
    original: "Original equation",
    replace: (value) => `Replace x with ${value}`,
    multiplyFirst: "Do the multiplication first",
    workOut: "Work out each side",
  },

  tutor: {
    praise: ["Nice choice!", "Exactly right!", "That works!", "Well spotted!", "Good thinking!"],
    dividedBy: (amount) => `divided by ${amount}`,
    multipliedBy: (amount) => `multiplied by ${amount}`,

    cancelsVariable: (kind, amount, term) =>
      `${gerund(kind, amount)} cancels the ${term} on one side, so the x-terms now end up on a single side.`,
    cancelsSubtracted: (attached, amount) =>
      `The ${attached} is subtracted. Adding is the inverse of subtracting, so ${MINUS} ${amount} and + ${amount} cancel each other out.`,
    cancelsAdded: (attached, amount) =>
      `The ${attached} is added. Subtracting is the inverse of adding, so + ${amount} and ${MINUS} ${amount} cancel each other out.`,
    staysEqual: "This keeps both sides equal and moves the equation closer to x = a number.",
    negativeNote: "Multiplying or dividing by a negative number flips the sign of every term.",
    orderNote:
      "Undoing the multiplication or division first also works here. Many people undo the + or − first because it keeps the numbers simple.",
    undoDivide: (words, amount) =>
      `x is ${words}. Dividing is the inverse of multiplying, so dividing by ${amount} leaves x on its own.`,
    undoMultiply: (words, amount) =>
      `x is ${words}. Multiplying is the inverse of dividing, so multiplying by ${amount} leaves x on its own.`,
    simpler: "This keeps both sides equal and makes the equation simpler.",
    clearsFractions: (amount) =>
      `${amount} is the smallest number that every denominator divides into. Multiplying both sides by ${amount} turns every fraction into a whole number, and both sides stay equal.`,

    solved: (value, sameAs) =>
      `x is on its own, so x = ${value}${sameAs ? ` (${sameAs} means the same as x = ${value})` : ""}. Check it by putting it back into the original equation.`,
    noSolution: (equation) =>
      `x has disappeared, and ${equation} is never true. The equation is identically false: no value of x can work, so it has no solution.`,
    infinite: (equation) =>
      `x has disappeared, and ${equation} is always true. The equation is identically true: every value of x works, so there are infinitely many solutions.`,
    nextClear: "Next: the equation still has fractions. Multiply both sides by the common denominator to get rid of them.",
    nextCollect: "Next: x is still on both sides, so collect the x-terms on one side.",
    nextConstant: "Next: there is still a number added to or subtracted from the x-term. Undo it.",
    nextCoefficient: (words) => `Next: x is still ${words}. Undo that with the inverse operation.`,

    noChange: {
      title: "That changes nothing",
      message:
        "Adding or subtracting 0, or multiplying or dividing by 1, leaves the equation exactly as it was. Choose an amount that brings x closer to being alone.",
    },
    awkward: (kind, amount, result) => ({
      title: "Allowed, but it gets messy",
      message: `${gerund(kind, amount)} is a valid move, but it leaves fractions: ${result}. Whole numbers are easier to work with. Try a move that keeps the numbers whole, which often means dealing with a number added to or subtracted from x first.`,
    }),
    wrongDirectionAdditive: (kind, amount) => ({
      title: "Almost — try the opposite operation",
      message: `${gerund(kind, amount)} keeps the equation balanced, but it adds to the problem instead of cancelling it. To cancel a term, do the opposite of what it does.`,
    }),
    wrongDirectionMultiplicative: (kind, amount) => ({
      title: "Almost — try the opposite operation",
      message: `${gerund(kind, amount)} keeps the equation balanced, but it does even more of what was done to x. To undo multiplying, divide; to undo dividing, multiply.`,
    }),
    wrongTermNumber: {
      title: "Check what you are cancelling",
      message: "The term you want to cancel is a plain number, with no x. Try again without the x.",
    },
    wrongTermVariable: {
      title: "Check what you are cancelling",
      message: "The term you want to remove contains x, so the amount you use needs an x as well.",
    },
    wrongAmount: {
      title: "Right idea, different number",
      message:
        "That is the right kind of move, but the number is not the one attached to x, so nothing cancels. Look closely at the number you want to remove.",
    },
    movesAway: (differentKind) => ({
      title: "That makes it harder",
      message: `The equation stays balanced, but x ends up further from being alone. Think about what is attached to x and how to undo it${differentKind ? " — a different kind of operation may be needed" : ""}.`,
    }),
    noProgress: {
      title: "Balanced, but not helpful",
      message:
        "Both sides are still equal, but x is no closer to being alone. Think about what is attached to x and which operation undoes it.",
    },

    hintClear1: "The equation has fractions. Whole numbers are easier, so get rid of the denominators first.",
    hintClear2: (amount) =>
      `Find a number that every denominator divides into. The smallest one is ${amount}. Multiply both sides by it, and every term too.`,
    hintCollect1: "x appears on both sides. First, get all the x-terms onto one side of the equals sign.",
    hintCollect2: (subtract) =>
      `Choose one x-term to remove. Removing the smaller one keeps the remaining x-term positive. ${
        subtract ? "It is added on its side, so subtract it from both sides." : "It is subtracted on its side, so add it to both sides."
      }`,
    hintConstant1:
      "Look at the side with x. Is a number being added or subtracted there? That number is in the way of getting x alone.",
    hintConstant2: (subtracted, attached) =>
      subtracted
        ? `The number is subtracted (${attached}). Subtraction is undone by addition, so use the opposite operation.`
        : `The number is added (${attached}). Addition is undone by subtraction, so use the opposite operation.`,
    hintCoefficient1: "Now x is multiplied or divided by a number. Which operation would undo that?",
    hintCoefficient2: (unitFraction, words) =>
      unitFraction
        ? `x is ${words}. Division is undone by multiplication, so multiply both sides by that number.`
        : `x is ${words}. Multiplication is undone by division, so divide both sides by that number.`,
    worked: (phrase, left, right, howTo) => `Try this: ${phrase}. Left side: ${left}. Right side: ${right}. ${howTo}`,
    howToEnter: (kindName, amount, withVariable) =>
      withVariable
        ? `Choose “${kindName}”, type ${amount} and turn on the x button.`
        : `Choose “${kindName}” and type ${amount}.`,
    flipTip: (term, becomes) => `Shortcut: in “Flip a term” mode, tap ${term}. It crosses the equals sign as ${becomes}.`,
  },

  session: {
    leftSide: (work) => `Left side: ${work}`,
    rightSide: (work) => `Right side: ${work}`,
    alone: "x is on its own!",
    noSolution: "This equation has no solution",
    infinite: "This equation has infinitely many solutions",
    repeatedTitle: "You have tried that one already",
    repeatedBody: "Look at what is attached to x, or use the hint button if you would like some help.",
    nowWeHave: (equation) => `Now we have ${equation}`,
  },

  prelude: {
    expandStage: "Open the brackets",
    simplifyStage: "Simplify",
    expandQuestion: (part) => `Open the brackets in ${part}. What do you get?`,
    simplifyQuestion: (part) => `Simplify ${part}. What do you get?`,
    expandRight: (part, result) =>
      `Every term inside the brackets is multiplied by the number outside: ${part} = ${result}.`,
    simplifyRight: (part, result) => `Combine the like terms: ${part} = ${result}.`,
    wrongTitle: "Not quite",
    wrong: {
      "forgot-term": "The number outside multiplies every term inside the brackets, not just one of them.",
      sign: "Check the signs: a minus times a plus gives a minus, and a minus times a minus gives a plus.",
      denominators: "You cannot add fractions by adding the denominators. Use a common denominator, then add the numerators.",
      arithmetic: "Check the arithmetic: work through the terms one at a time.",
    },
    done: "The equation is now in simple form. Now solve it.",
  },

  flip: {
    term: (term, becomes, bar, phrase) =>
      `The ${term} crosses the equals sign and its sign flips: on the other side it is ${becomes}. It is shorthand for: ${phrase}. In a notebook you write ${bar} next to the equation. On the side it left, the term cancels out.`,
    factorDivide: (factor) =>
      `${factor} multiplies x, so it crosses the equals sign as a division: both sides are divided by ${factor}.`,
    factorMultiply: (factor) =>
      `x is divided by ${factor}, so ${factor} crosses the equals sign as a multiplication: both sides are multiplied by ${factor}.`,
    movedLine: (moved) => `After flipping: ${moved}`,
    sameAs: (bar) => `Same as writing ${bar} next to the equation`,
    notHelpfulTitle: "Flipping that does not help yet",
    notHelpful: (term) =>
      `Flipping ${term} keeps the equation correct, but it does not bring x closer to being alone. Look for the number that is in the way of x.`,
  },

  written: {
    empty: { title: "Write your equation first", body: "Type the equation the story gives, using x for the number you are looking for." },
    "no-equals": { title: "An equation needs an equals sign", body: "Put = between the two things that are equal, for example 2x + 3 = 15." },
    "many-equals": { title: "Only one equals sign", body: "An equation has two sides with one = between them." },
    "unknown-letter": { title: "Use x for the unknown", body: "Write the number you are looking for as x. Other letters are not used here." },
    "not-linear": { title: "That has x times x or x underneath", body: "These stories only need x on its own, multiplied by a number or divided by a number." },
    unreadable: { title: "I cannot read that", body: "Check the brackets and the signs. Write numbers, x, + − · : ( ) and one =." },
  },

  build: {
    exact: {
      title: "That is the equation!",
      body: "It says exactly what the story says. Now solve it to find x.",
    },
    equivalent: {
      title: "That works too",
      body: "Your equation has the same solution as the story, so we will solve yours.",
    },
    answerGiven: {
      title: "x is already on its own there",
      body: "Write the equation the story gives you first, with the numbers from the story. Solving it comes next.",
    },
    noVariable: {
      title: "There is no x in your equation",
      body: "Use x for the number you are looking for, and put it in the equation.",
    },
    sign: {
      title: "Check the plus and minus signs",
      body: "In the story, is something added or taken away? The sign in front of each number must match the story.",
    },
    swapped: {
      title: "Check which number goes with x",
      body: "The number that happens again and again (for each kilometre, week or notebook) is multiplied by x. A number that happens once is added or subtracted on its own.",
    },
    total: {
      title: "Check the total",
      body: "One side of the equation should be what the story says in total. Compare the number after the equals sign with the story.",
    },
    general: {
      title: "That is not what the story says yet",
      body: "Go through the story in order: what is x? What happens to x? What is the result? Write each part down as maths.",
    },
  },
};
