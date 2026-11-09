"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { Check, Delete, Eraser, X } from "lucide-react";
import { useI18n } from "@/hooks/useLang";
import { engineText } from "@/lib/equations";
import { MathLine } from "@/components/ui/MathLine";

export interface MathPadProps {
  /** The id of the text field, so that a label can point at it. */
  inputId: string;
  value: string;
  onChange: (next: string) => void;
  /** A locked field is shown as it is, without keys. */
  disabled?: boolean;
  /** The two bars (`||`) that write the step beside a line: only the by-hand screen has them. */
  bar?: { name: string };
  /**
   * `line` is a whole equation, with every key. `number` is for one number, such as the final answer: digits,
   * a decimal sign, a minus sign and the fraction key, and nothing else.
   */
  mode?: "line" | "number";
  /** Written before the number in the picture of it, such as `x = `. */
  prefix?: string;
}

/** Which part of a fraction is being filled in. */
type Part = "top" | "bottom";

/** A fraction being made: what is written in each part, and where in the line it will go. */
interface Builder {
  top: string;
  bottom: string;
  active: Part;
  from: number;
  to: number;
}

interface PadKey {
  label: string;
  insert: string;
  name: string;
  kind: "digit" | "sign" | "x" | "bracket" | "equals" | "delete" | "clear";
}

/**
 * Adds a key to one part of a fraction. A sign that starts the part is a minus sign (−3), not an operation,
 * and an operation with nothing before it is left out.
 */
export function appendToPart(current: string, key: string): string {
  const sign = key.trim();
  if (sign !== "+" && sign !== "−" && sign !== "×" && sign !== "÷" && sign !== "·" && sign !== ":") return current + key;
  const before = current.trimEnd();
  if (before === "" || before.endsWith("(")) return sign === "−" ? `${before}−` : current;
  return `${before} ${sign} `;
}

/** Takes the last key out of one part of a fraction: a sign that was added with its spaces goes with them. */
export function removeFromPart(text: string): string {
  return /\s[+−×÷·:]\s$/.test(text) ? text.slice(0, -3) : text.slice(0, -1);
}

/** The text a finished fraction becomes in the line: x/3, 2x/5, (x + 2)/3. */
export function fractionText(top: string, bottom: string): string {
  const wrap = (part: string) => (/^[^\s()]+$/.test(part) ? part : `(${part})`);
  return `${wrap(top.trim())}/${wrap(bottom.trim())}`;
}

/** The line as it is written, with the spaces and minus signs of a notebook, ready to be drawn. */
function tidy(text: string): { line: string; note: string } {
  const bars = text.indexOf("||");
  const line = (bars === -1 ? text : text.slice(0, bars)).replace(/\s*=\s*/g, " = ").replace(/-/g, "−").trim();
  return { line, note: bars === -1 ? "" : text.slice(bars).replace(/-/g, "−").trim() };
}

/**
 * Where a learner writes an equation line, with the keys on the screen.
 *
 * The text field is the truth: the engine reads what is in it, and a hardware keyboard works as always.
 * The keys are for phones, where numbers, x, brackets and the equals sign hide behind keyboard layers. They
 * put what is pressed at the caret, and keep the caret where it was, without opening the phone's keyboard.
 *
 * The fraction key is for writing x over 3 the way it looks: two boxes, one above the other, filled by
 * pressing the keys. It puts `x/3` (or `(x + 2)/3`) in the line, which the engine reads and which the line
 * shows as a stacked fraction as soon as it is there.
 */
export function MathPad({ inputId, value, onChange, disabled = false, bar, mode = "line", prefix = "" }: MathPadProps) {
  const numberMode = mode === "number";
  const { lang, t } = useI18n();
  const words = engineText(lang);
  const pad = t.pad;
  const names = t.word.keyNames;
  const field = useRef<HTMLInputElement>(null);
  const topSlot = useRef<HTMLButtonElement>(null);
  // Where the caret goes after the next render, and whether the field keeps the focus it had.
  const caret = useRef<{ at: number; focus: boolean } | null>(null);
  const [builder, setBuilder] = useState<Builder | null>(null);
  const building = builder !== null;

  useEffect(() => {
    if (caret.current !== null && field.current) {
      if (caret.current.focus) field.current.focus();
      field.current.setSelectionRange(caret.current.at, caret.current.at);
      caret.current = null;
    }
  });

  // A fraction that has just been opened waits for its first key: put the focus on its top part.
  useEffect(() => {
    if (building) topSlot.current?.focus();
  }, [building]);

  function selection() {
    const input = field.current;
    return { start: input?.selectionStart ?? value.length, end: input?.selectionEnd ?? value.length };
  }

  function insertAtCaret(text: string) {
    const { start, end } = selection();
    caret.current = { at: start + text.length, focus: document.activeElement === field.current };
    onChange(`${value.slice(0, start)}${text}${value.slice(end)}`);
  }

  function deleteAtCaret() {
    const { start, end } = selection();
    if (start === end && start === 0) return;
    const from = start === end ? start - 1 : start;
    caret.current = { at: from, focus: document.activeElement === field.current };
    onChange(`${value.slice(0, from)}${value.slice(end)}`);
  }

  function clearLine() {
    caret.current = { at: 0, focus: document.activeElement === field.current };
    onChange("");
  }

  function press(text: string) {
    if (builder) setBuilder({ ...builder, [builder.active]: appendToPart(builder[builder.active], text) });
    else insertAtCaret(text);
  }

  function backspace() {
    if (!builder) return deleteAtCaret();
    const text = builder[builder.active];
    if (text === "" && builder.active === "bottom") return setBuilder({ ...builder, active: "top" });
    setBuilder({ ...builder, [builder.active]: removeFromPart(text) });
  }

  function openBuilder() {
    const { start, end } = selection();
    const chosen = value.slice(start, end).trim();
    // Words already in the line, picked out before the fraction key is pressed, become the top of the fraction.
    setBuilder({ top: chosen, bottom: "", active: chosen === "" ? "top" : "bottom", from: start, to: end });
  }

  function putFraction() {
    if (!builder || builder.top.trim() === "" || builder.bottom.trim() === "") return;
    const from = Math.min(builder.from, value.length);
    const to = Math.min(builder.to, value.length);
    const text = fractionText(builder.top, builder.bottom);
    caret.current = { at: from + text.length, focus: false };
    setBuilder(null);
    onChange(`${value.slice(0, from)}${text}${value.slice(to)}`);
  }

  function builderKeys(event: KeyboardEvent) {
    if (!builder || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === "Escape") {
      event.preventDefault();
      setBuilder(null);
      field.current?.focus();
    } else if (event.key === "Enter") {
      event.preventDefault();
      putFraction();
    } else if (event.key === "Backspace") {
      event.preventDefault();
      backspace();
    } else if (/^[0-9]$/.test(event.key) || (!numberMode && (event.key === "x" || event.key === "X"))) {
      event.preventDefault();
      press(event.key.toLowerCase());
    } else if (event.key === "." || event.key === ",") {
      event.preventDefault();
      press(lang === "fi" ? "," : ".");
    } else if (event.key === "+" || event.key === "-") {
      event.preventDefault();
      press(event.key === "-" ? "−" : "+");
    } else if (event.key === "(" || event.key === ")") {
      event.preventDefault();
      press(event.key);
    }
  }

  const shown = tidy(value);
  const point = lang === "fi" ? "," : ".";
  const digit = (n: string): PadKey => ({ label: n, insert: n, name: n, kind: "digit" });
  const lineKeys: readonly PadKey[] = [
    digit("7"),
    digit("8"),
    digit("9"),
    { label: words.divide, insert: ` ${words.divide} `, name: names.divide, kind: "sign" },
    { label: "", insert: "", name: names.delete, kind: "delete" },
    digit("4"),
    digit("5"),
    digit("6"),
    { label: words.times, insert: ` ${words.times} `, name: names.times, kind: "sign" },
    { label: "(", insert: "(", name: names.open, kind: "bracket" },
    digit("1"),
    digit("2"),
    digit("3"),
    { label: "−", insert: " − ", name: names.minus, kind: "sign" },
    { label: ")", insert: ")", name: names.close, kind: "bracket" },
    digit("0"),
    { label: point, insert: point, name: names.point, kind: "digit" },
    { label: "x", insert: "x", name: names.x, kind: "x" },
    { label: "+", insert: " + ", name: names.plus, kind: "sign" },
    { label: "=", insert: " = ", name: names.equals, kind: "equals" },
  ];
  // One number: four columns, the fraction key at the bottom.
  const numberKeys: readonly PadKey[] = [
    digit("7"),
    digit("8"),
    digit("9"),
    { label: "", insert: "", name: names.delete, kind: "delete" },
    digit("4"),
    digit("5"),
    digit("6"),
    { label: "−", insert: "−", name: names.minus, kind: "sign" },
    digit("1"),
    digit("2"),
    digit("3"),
    { label: "", insert: "", name: pad.clear, kind: "clear" },
    digit("0"),
    { label: point, insert: point, name: names.point, kind: "digit" },
  ];
  const keys = numberMode ? numberKeys : lineKeys;

  // Keys are pressed without taking the focus from the line, so a phone's own keyboard does not slide up over them.
  const keepFocus = { onMouseDown: (event: { preventDefault: () => void }) => event.preventDefault() };

  return (
    <div className="pad">
      <input
        id={inputId}
        ref={field}
        className="write-input"
        type="text"
        inputMode="text"
        enterKeyHint="done"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />

      {/* Always there, so the keys do not jump down the first time a key is pressed. */}
      <div className="pad-preview" aria-hidden="true">
        <span className="pad-preview-label">{pad.howItLooks}</span>
        {value.trim() !== "" ? <MathLine text={`${prefix}${shown.line}`} /> : <span className="pad-preview-empty">{numberMode ? pad.previewEmptyNumber : pad.previewEmpty}</span>}
        {shown.note !== "" && <span className="pad-preview-note">{shown.note}</span>}
      </div>

      {!disabled && builder && (
        <div className="fraction-builder" role="group" aria-label={pad.builderTitle} onKeyDown={builderKeys}>
          <p className="fraction-title">{pad.builderTitle}</p>
          <div className="fraction-slots">
            <button
              type="button"
              ref={topSlot}
              className={`slot${builder.active === "top" ? " slot-active" : ""}`}
              aria-pressed={builder.active === "top"}
              aria-label={`${pad.topName}: ${builder.top === "" ? pad.emptySlot : builder.top}`}
              onClick={() => setBuilder({ ...builder, active: "top" })}
            >
              {builder.top === "" ? <span className="slot-empty">{pad.top}</span> : builder.top}
            </button>
            <span className="fraction-bar" aria-hidden="true" />
            <button
              type="button"
              className={`slot${builder.active === "bottom" ? " slot-active" : ""}`}
              aria-pressed={builder.active === "bottom"}
              aria-label={`${pad.bottomName}: ${builder.bottom === "" ? pad.emptySlot : builder.bottom}`}
              onClick={() => setBuilder({ ...builder, active: "bottom" })}
            >
              {builder.bottom === "" ? <span className="slot-empty">{pad.bottom}</span> : builder.bottom}
            </button>
          </div>
          <p className="fraction-hint">{pad.builderHint}</p>
          <div className="action-buttons">
            <button type="button" className="button-primary" disabled={builder.top.trim() === "" || builder.bottom.trim() === ""} onClick={putFraction}>
              <Check size={16} aria-hidden="true" /> {pad.put}
            </button>
            <button type="button" className="button-secondary" onClick={() => setBuilder(null)}>
              <X size={16} aria-hidden="true" /> {pad.cancel}
            </button>
          </div>
        </div>
      )}

      {!disabled && (
        <div className={`keypad${numberMode ? " keypad-number" : ""}`} role="group" aria-label={t.word.keysLabel}>
          {keys.map((key, index) =>
            key.kind === "delete" ? (
              <button type="button" className="key key-delete" key="delete" aria-label={key.name} onClick={backspace} {...keepFocus}>
                <Delete size={20} aria-hidden="true" />
              </button>
            ) : key.kind === "clear" ? (
              <button
                type="button"
                className="key key-clear"
                key="clear"
                aria-label={key.name}
                disabled={value === "" && !building}
                onClick={() => (building ? setBuilder(null) : clearLine())}
                {...keepFocus}
              >
                <Eraser size={20} aria-hidden="true" />
              </button>
            ) : (
              <button
                type="button"
                className={`key key-${key.kind}`}
                key={`${index}-${key.name}`}
                aria-label={key.kind === "digit" && key.name === key.label ? undefined : key.name}
                disabled={building && key.kind === "equals"}
                onClick={() => press(key.insert)}
                {...keepFocus}
              >
                {key.label}
              </button>
            ),
          )}
          <button
            type="button"
            className="key key-fraction"
            style={{ gridColumn: numberMode || bar ? "span 2" : "span 3" }}
            aria-label={pad.fractionKey}
            aria-expanded={building}
            disabled={building}
            onClick={openBuilder}
            {...keepFocus}
          >
            <span className="key-frac" aria-hidden="true">
              <i />
              <b />
              <i />
            </span>
            {pad.fraction}
          </button>
          {bar && (
            <button type="button" className="key key-bar" style={{ gridColumn: "span 2" }} aria-label={bar.name} disabled={building} onClick={() => press(" || ")} {...keepFocus}>
              ||
            </button>
          )}
          {!numberMode && (
            <button
              type="button"
              className="key key-clear"
              style={{ gridColumn: bar ? "span 1" : "span 2" }}
              aria-label={pad.clear}
              disabled={value === "" && !building}
              onClick={() => (building ? setBuilder(null) : clearLine())}
              {...keepFocus}
            >
              <Eraser size={20} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
