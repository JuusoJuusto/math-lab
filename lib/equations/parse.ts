/**
 * Parser for linear equations in one variable.
 *
 * It exists so that exercises can be authored as readable strings such as
 * `"2x + 5 = 17"` or `"3(x - 2) = 2x + 5"`, and so that anything typed in
 * later (for example a "try your own equation" feature) is validated safely.
 *
 * Supported: whole numbers and decimals, the variable `x`, `+ - * / ( )`,
 * implicit multiplication such as `2x` or `3(x + 1)`, and the typographic
 * symbols `−` `×` `÷`. Anything that is not linear in x is rejected.
 */

import {
  FractionRangeError,
  ONE,
  ZERO,
  div,
  frac,
  isZero,
  neg,
  type Fraction,
} from "./fraction";
import { addExpr, equation, expr, isConstantExpr, scaleExpr, subExpr, type Equation, type LinearExpr } from "./expression";

export type ParseResult<T> = { readonly ok: true; readonly value: T } | { readonly ok: false; readonly message: string };

class ParseError extends Error {}

type Token =
  | { readonly type: "number"; readonly value: Fraction }
  | { readonly type: "x" }
  | { readonly type: "op"; readonly op: "+" | "-" | "*" | "/" }
  | { readonly type: "(" }
  | { readonly type: ")" }
  | { readonly type: "=" };

const MAX_DECIMAL_PLACES = 4;

function tokenise(text: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < text.length) {
    const ch = text[i];

    if (/\s/.test(ch)) {
      i += 1;
    } else if (/[0-9.]/.test(ch)) {
      let j = i;
      while (j < text.length && /[0-9.]/.test(text[j])) j += 1;
      tokens.push({ type: "number", value: parseNumber(text.slice(i, j)) });
      i = j;
    } else if (ch === "x" || ch === "X") {
      tokens.push({ type: "x" });
      i += 1;
    } else if (ch === "+") {
      tokens.push({ type: "op", op: "+" });
      i += 1;
    } else if (ch === "-" || ch === "−" || ch === "–") {
      tokens.push({ type: "op", op: "-" });
      i += 1;
    } else if (ch === "*" || ch === "×" || ch === "·") {
      tokens.push({ type: "op", op: "*" });
      i += 1;
    } else if (ch === "/" || ch === "÷") {
      tokens.push({ type: "op", op: "/" });
      i += 1;
    } else if (ch === "(") {
      tokens.push({ type: "(" });
      i += 1;
    } else if (ch === ")") {
      tokens.push({ type: ")" });
      i += 1;
    } else if (ch === "=") {
      tokens.push({ type: "=" });
      i += 1;
    } else {
      throw new ParseError(`"${ch}" is not part of an equation here. Use numbers, x and + - × ÷ ( ) =.`);
    }
  }
  return tokens;
}

function parseNumber(text: string): Fraction {
  if (!/^(\d+\.?\d*|\.\d+)$/.test(text)) {
    throw new ParseError(`"${text}" is not a valid number.`);
  }
  const [whole = "", decimals = ""] = text.split(".");
  if (decimals.length > MAX_DECIMAL_PLACES) {
    throw new ParseError(`Use at most ${MAX_DECIMAL_PLACES} decimal places.`);
  }
  return frac(Number(whole + decimals), 10 ** decimals.length);
}

class Parser {
  private position = 0;

  constructor(private readonly tokens: readonly Token[]) {}

  private peek(): Token | undefined {
    return this.tokens[this.position];
  }

  private take(): Token | undefined {
    const token = this.tokens[this.position];
    this.position += 1;
    return token;
  }

  atEnd(): boolean {
    return this.position >= this.tokens.length;
  }

  expectEnd(): void {
    if (!this.atEnd()) {
      throw new ParseError("There is something unexpected at the end of the equation.");
    }
  }

  expectEquals(): void {
    if (this.atEnd()) {
      throw new ParseError("An equation needs an equals sign (=).");
    }
    if (this.peek()?.type !== "=") {
      throw new ParseError("Something unexpected comes before the equals sign. Is an operator such as + or − missing?");
    }
    this.take();
  }

  expression(): LinearExpr {
    let result = this.term();
    for (;;) {
      const token = this.peek();
      if (token?.type === "op" && (token.op === "+" || token.op === "-")) {
        this.take();
        const right = this.term();
        result = token.op === "+" ? addExpr(result, right) : subExpr(result, right);
      } else {
        return result;
      }
    }
  }

  private term(): LinearExpr {
    let result = this.unary();
    for (;;) {
      const token = this.peek();
      if (token?.type === "op" && token.op === "*") {
        this.take();
        result = multiply(result, this.unary());
      } else if (token?.type === "op" && token.op === "/") {
        this.take();
        result = divide(result, this.unary());
      } else if (token?.type === "x" || token?.type === "(") {
        // Implicit multiplication, as in 2x or 3(x + 1).
        result = multiply(result, this.unary());
      } else {
        return result;
      }
    }
  }

  private unary(): LinearExpr {
    const token = this.peek();
    if (token?.type === "op" && (token.op === "+" || token.op === "-")) {
      this.take();
      const operand = this.unary();
      return token.op === "-" ? scaleExpr(operand, neg(ONE)) : operand;
    }
    return this.primary();
  }

  private primary(): LinearExpr {
    const token = this.take();
    if (!token) throw new ParseError("The equation ends too early.");
    switch (token.type) {
      case "number":
        return expr(ZERO, token.value);
      case "x":
        return expr(ONE, ZERO);
      case "(": {
        const inner = this.expression();
        if (this.take()?.type !== ")") throw new ParseError("A bracket is not closed.");
        return inner;
      }
      default:
        throw new ParseError("A number, x or bracket is missing here.");
    }
  }
}

function multiply(a: LinearExpr, b: LinearExpr): LinearExpr {
  if (isConstantExpr(a)) return scaleExpr(b, a.c);
  if (isConstantExpr(b)) return scaleExpr(a, b.c);
  throw new ParseError("Multiplying x by x makes the equation non-linear, which MathLab does not cover yet.");
}

function divide(a: LinearExpr, b: LinearExpr): LinearExpr {
  if (!isConstantExpr(b)) {
    throw new ParseError("Dividing by an expression with x is not supported.");
  }
  if (isZero(b.c)) {
    throw new ParseError("Division by zero is undefined.");
  }
  return expr(div(a.x, b.c), div(a.c, b.c));
}

function run<T>(text: string, parse: (parser: Parser) => T): ParseResult<T> {
  try {
    if (text.trim() === "") return { ok: false, message: "Type an equation first." };
    const parser = new Parser(tokenise(text));
    const value = parse(parser);
    parser.expectEnd();
    return { ok: true, value };
  } catch (error) {
    if (error instanceof ParseError) return { ok: false, message: error.message };
    if (error instanceof FractionRangeError) return { ok: false, message: error.message };
    throw error;
  }
}

/** Parses a single linear expression such as `2x + 5`. */
export function parseExpression(text: string): ParseResult<LinearExpr> {
  return run(text, (parser) => parser.expression());
}

/** Parses an equation such as `2x + 5 = 17`. */
export function parseEquation(text: string): ParseResult<Equation> {
  return run(text, (parser) => {
    const left = parser.expression();
    parser.expectEquals();
    const right = parser.expression();
    return equation(left, right);
  });
}

/**
 * Parses an equation that is known to be valid, such as one from the exercise
 * catalogue. Throws with a clear message so that authoring mistakes surface in
 * tests instead of in front of a learner.
 */
export function mustParseEquation(text: string): Equation {
  const result = parseEquation(text);
  if (!result.ok) {
    throw new Error(`Invalid equation "${text}": ${result.message}`);
  }
  return result.value;
}
