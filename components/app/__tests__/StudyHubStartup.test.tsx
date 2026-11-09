import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** Loads the app fresh, as the browser does: the Study Hub module reads the address when the script loads. */
async function start(address: string) {
  vi.resetModules();
  window.sessionStorage.clear();
  window.history.replaceState(null, "", address);
  const { App } = await import("../App");
  render(<App />);
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(() => Promise.resolve({ status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.sessionStorage.clear();
});

describe("a student who comes from Study Hub", () => {
  it("lands on the page they asked for, with the token kept for the visit and gone from the address bar", async () => {
    await start("/en/learn/#hub_token=abc.def-123");
    expect(await screen.findByRole("heading", { level: 1, name: /Learn/ })).toBeTruthy();
    expect(window.location.hash).toBe("");
    expect(window.location.pathname).toBe("/en/learn/");
    expect(window.sessionStorage.getItem("studyhub_token")).toBe("abc.def-123");
    // Opening a page reports nothing: only learning does.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("takes the token out again when the framework puts the original address back after the page has loaded", async () => {
    vi.resetModules();
    window.sessionStorage.clear();
    window.history.replaceState(null, "", "/en/learn/#hub_token=abc");
    const { App } = await import("../App");
    // The script has already removed it...
    expect(window.location.hash).toBe("");
    // ...and then Next.js restores the address it saw at load time, while the page hydrates.
    window.history.replaceState(null, "", "/en/learn/#hub_token=abc");
    render(<App />);
    expect(await screen.findByRole("heading", { level: 1, name: /Learn/ })).toBeTruthy();
    expect(window.location.hash).toBe("");
    expect(window.location.pathname).toBe("/en/learn/");
    expect(window.sessionStorage.getItem("studyhub_token")).toBe("abc");
  });

  it("keeps a token that is only in memory (storage blocked) when there is nothing to clean up", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    await start("/en/learn/#hub_token=mem");
    await screen.findByRole("heading", { level: 1, name: /Learn/ });
    expect(window.location.hash).toBe("");
    // The effect must not call init again when the hash is already clean: that would forget the token held in memory.
    const { reportProgress } = await import("@/src/studyHubProgress");
    reportProgress("started", { ref: "x" });
    await new Promise((resolve) => setTimeout(resolve, 2100));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).token).toBe("mem");
  });

  it("opens the Finnish app the same way", async () => {
    await start("/fi/#hub_token=abc");
    expect(window.location.hash).toBe("");
    expect(window.location.pathname).toBe("/fi/");
    expect(window.sessionStorage.getItem("studyhub_token")).toBe("abc");
    expect(document.documentElement.lang).toBe("fi");
  });
});

describe("a student who comes some other way", () => {
  it("sees exactly the same app and nothing is sent or stored", async () => {
    await start("/en/learn/");
    expect(await screen.findByRole("heading", { level: 1, name: /Learn/ })).toBeTruthy();
    expect(window.sessionStorage.getItem("studyhub_token")).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keeps old short links working: #/learn is still upgraded to the page address", async () => {
    await start("/en/#/learn/two-step");
    expect(window.location.pathname).toBe("/en/learn/two-step/");
    expect(window.sessionStorage.getItem("studyhub_token")).toBeNull();
  });
});
