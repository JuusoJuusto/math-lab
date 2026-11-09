import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LangProvider } from "@/hooks/useLang";
import { en } from "@/lib/i18n/ui-en";
import { fi } from "@/lib/i18n/ui-fi";
import { LEVELS, getLevel } from "@/lib/equations";
import { WorkedExample } from "../WorkedExample";

const words = { en: en.solver.example, fi: fi.solver.example };

/** Presses the tutor's button until the example is over, and says whether it ever got to the end. */
async function playToTheEnd(lang: "en" | "fi", levelId: string) {
  const onPractise = vi.fn();
  const user = userEvent.setup();
  const level = getLevel(levelId)!;
  render(
    <LangProvider lang={lang}>
      <WorkedExample level={level} onPractise={onPractise} />
    </LangProvider>,
  );
  const tryIt = () => screen.queryByRole("button", { name: new RegExp(words[lang].tryIt) });
  for (let guard = 0; guard < 60 && !tryIt(); guard += 1) {
    const next = document.querySelector<HTMLButtonElement>(".workspace-main .action-buttons .button-primary");
    if (!next) break;
    await user.click(next);
  }
  return { tryIt, onPractise, user };
}

describe("the worked example of every lesson", () => {
  const ids = LEVELS.filter((level) => level.kind !== "stories").map((level) => level.id);

  for (const lang of ["en", "fi"] as const) {
    it.each(ids)(`reaches its end and offers to try it yourself (${lang}): %s`, async (id) => {
      const { tryIt, onPractise, user } = await playToTheEnd(lang, id);
      expect(tryIt(), `${id} never offered the way on`).toBeTruthy();
      await user.click(tryIt()!);
      expect(onPractise).toHaveBeenCalledTimes(1);
    });
  }

  it("ends the 'no solution' lesson with the statement it leaves, and a way on, not a button that does nothing", async () => {
    const { tryIt } = await playToTheEnd("en", "special");
    expect(document.querySelector(".eq")?.getAttribute("data-equation")).toBe("3 = 7");
    expect(screen.getByText("This equation has no solution")).toBeTruthy();
    expect(tryIt()).toBeTruthy();
    // There is no value of x to put in, so there is nothing to check by substituting.
    expect(screen.queryByRole("button", { name: /Check by substituting/ })).toBeNull();
    expect(screen.queryByRole("button", { name: words.en.next })).toBeNull();
    expect(screen.getByRole("button", { name: /Watch again/ })).toBeTruthy();
  });

  it("can be watched again from the start", async () => {
    const { tryIt, user } = await playToTheEnd("en", "special");
    await user.click(screen.getByRole("button", { name: /Watch again/ }));
    expect(tryIt()).toBeNull();
    expect(screen.getByRole("button", { name: words.en.first })).toBeTruthy();
  });
});
