import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/** A fresh copy of the module each time, because it keeps the token and the queue in module variables. */
async function load() {
  vi.resetModules();
  return import("../studyHubProgress");
}

const URL = "https://insaneones.xyz/api/apps/progress";
let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  window.sessionStorage.clear();
  window.history.replaceState(null, "", "/en/learn/?x=1");
  fetchMock = vi.fn(() => Promise.resolve({ status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

/** What was posted in the n-th request. */
const posted = (n = 0) => JSON.parse(fetchMock.mock.calls[n][1].body as string) as { token: string; events: Record<string, unknown>[] };

describe("without a token the app behaves exactly as before", () => {
  it("sends nothing, however much happens", async () => {
    const hub = await load();
    expect(hub.initStudyHub()).toBe(false);
    hub.reportProgress("started", { label: "Level 1", ref: "lesson-one-step" });
    hub.reportProgress("score", { value: 3, max: 5 });
    window.dispatchEvent(new Event("pagehide"));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("leaves the address alone", async () => {
    window.history.replaceState(null, "", "/en/learn/?x=1#/practice");
    const hub = await load();
    hub.initStudyHub();
    expect(window.location.pathname + window.location.search + window.location.hash).toBe("/en/learn/?x=1#/practice");
  });
});

describe("the token", () => {
  it("is read from the address, kept for the visit and removed from the address bar", async () => {
    window.history.replaceState(null, "", "/en/learn/?x=1#hub_token=abc.def-123");
    const hub = await load();
    expect(hub.initStudyHub()).toBe(true);
    expect(window.location.hash).toBe("");
    expect(window.location.pathname + window.location.search).toBe("/en/learn/?x=1");
    expect(window.sessionStorage.getItem("studyhub_token")).toBe("abc.def-123");
  });

  it("leaves other things after the # in place", async () => {
    window.history.replaceState(null, "", "/en/#hub_token=abc&section=2");
    const hub = await load();
    expect(hub.initStudyHub()).toBe(true);
    expect(window.location.hash).toBe("#section=2");
  });

  it("is found again on the next page of the same visit, when the address no longer has it", async () => {
    window.sessionStorage.setItem("studyhub_token", "kept");
    const hub = await load();
    expect(hub.initStudyHub()).toBe(true);
    hub.reportProgress("started", { ref: "x" });
    await vi.advanceTimersByTimeAsync(2000);
    expect(posted().token).toBe("kept");
  });

  it("stays in memory when storage is not allowed (private mode), and never throws", async () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied");
    });
    window.history.replaceState(null, "", "/en/#hub_token=mem");
    const hub = await load();
    expect(hub.initStudyHub()).toBe(true);
    hub.reportProgress("started", { ref: "x" });
    await vi.advanceTimersByTimeAsync(2000);
    expect(posted().token).toBe("mem");
  });

  it("is not needed to read the page when storage cannot even be read", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    const hub = await load();
    expect(hub.initStudyHub()).toBe(false);
  });
});

describe("the report", () => {
  async function withToken() {
    window.history.replaceState(null, "", "/en/#hub_token=TKN");
    const hub = await load();
    hub.initStudyHub();
    return hub;
  }

  it("is one plain request to the school's own site, with no cookies, sent a moment after the event", async () => {
    const hub = await withToken();
    hub.reportProgress("started", { label: "Two-step equations", ref: "lesson-two-step" });
    expect(fetchMock).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(2000);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe(URL);
    expect(options).toMatchObject({ method: "POST", mode: "cors", credentials: "omit", keepalive: true });
    // text/plain keeps it a simple request, so the browser sends no preflight.
    expect(options.headers).toEqual({ "Content-Type": "text/plain;charset=UTF-8" });
    expect(posted()).toEqual({
      token: "TKN",
      events: [{ kind: "started", label: "Two-step equations", ref: "lesson-two-step", value: null, max: null }],
    });
  });

  it("puts events that come close together in one request", async () => {
    const hub = await withToken();
    hub.reportProgress("started", { ref: "a" });
    hub.reportProgress("progress", { ref: "a", value: 25 });
    hub.reportProgress("score", { ref: "a", value: 4, max: 5 });
    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(posted().events.map((event) => event.kind)).toEqual(["started", "progress", "score"]);
    expect(posted().events[2]).toMatchObject({ value: 4, max: 5 });
  });

  it("cleans up the text and the numbers", async () => {
    const hub = await withToken();
    hub.reportProgress("score", { label: `  A   long\n name ${"x".repeat(200)}`, ref: "r".repeat(120), value: 3.14159, max: Number.POSITIVE_INFINITY });
    hub.reportProgress("level", { label: 5 as unknown as string, value: Number.NaN });
    await vi.advanceTimersByTimeAsync(2000);
    const [first, second] = posted().events;
    expect(String(first.label)).toMatch(/^A long name x+$/);
    expect(String(first.label)).toHaveLength(80);
    expect(String(first.ref)).toHaveLength(80);
    expect(first.value).toBe(3.14);
    expect(first.max).toBeNull();
    expect(second).toMatchObject({ kind: "level", label: "", ref: "", value: null, max: null });
  });

  it("ignores a kind it does not know", async () => {
    const hub = await withToken();
    hub.reportProgress("clicked" as never, { ref: "x" });
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("sends at most 20 events in a request", async () => {
    const hub = await withToken();
    for (let i = 0; i < 45; i += 1) hub.reportProgress("progress", { ref: `r${i}`, value: i });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetchMock.mock.calls.map((_, n) => posted(n).events.length)).toEqual([20, 20, 5]);
  });

  it("stops after 200 events in a visit", async () => {
    const hub = await withToken();
    for (let i = 0; i < 260; i += 1) hub.reportProgress("progress", { ref: `r${i}`, value: i % 100 });
    await vi.advanceTimersByTimeAsync(60_000);
    const total = fetchMock.mock.calls.reduce((sum, _, n) => sum + posted(n).events.length, 0);
    expect(total).toBe(200);
    hub.reportProgress("started", { ref: "late" });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetchMock.mock.calls.reduce((sum, _, n) => sum + posted(n).events.length, 0)).toBe(200);
  });

  it("is sent at once when the page is hidden or closed", async () => {
    const hub = await withToken();
    hub.reportProgress("completed", { ref: "lesson-one-step" });
    window.dispatchEvent(new Event("pagehide"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(posted().events[0]).toMatchObject({ kind: "completed" });
  });

  it("does not post twice for the same events when the page is hidden after they were sent", async () => {
    const hub = await withToken();
    hub.reportProgress("started", { ref: "a" });
    await vi.advanceTimersByTimeAsync(2000);
    window.dispatchEvent(new Event("pagehide"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

describe("when sending does not work, nothing happens to the app", () => {
  async function withToken() {
    window.history.replaceState(null, "", "/en/#hub_token=TKN");
    const hub = await load();
    hub.initStudyHub();
    return hub;
  }

  it("a request that fails (blocked, offline) is forgotten, without an error and without trying again", async () => {
    fetchMock.mockImplementation(() => Promise.reject(new TypeError("Failed to fetch")));
    const hub = await withToken();
    expect(() => hub.reportProgress("started", { ref: "a" })).not.toThrow();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("fetch itself throwing is no problem", async () => {
    fetchMock.mockImplementation(() => {
      throw new Error("blocked by an extension");
    });
    const hub = await withToken();
    hub.reportProgress("started", { ref: "a" });
    await expect(vi.advanceTimersByTimeAsync(2000)).resolves.not.toThrow();
  });

  it("a browser without fetch is no problem either", async () => {
    vi.stubGlobal("fetch", undefined);
    const hub = await withToken();
    hub.reportProgress("started", { ref: "a" });
    await expect(vi.advanceTimersByTimeAsync(2000)).resolves.not.toThrow();
  });

  it("an error answer (4xx or 5xx) is not an error for the student, and later reports still go out", async () => {
    fetchMock.mockImplementation(() => Promise.resolve({ status: 500 }));
    const hub = await withToken();
    hub.reportProgress("started", { ref: "a" });
    await vi.advanceTimersByTimeAsync(2000);
    hub.reportProgress("score", { ref: "a", value: 1, max: 2 });
    await vi.advanceTimersByTimeAsync(2000);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("a 401 (the token has run out) ends the reporting for this visit", async () => {
    fetchMock.mockImplementation(() => Promise.resolve({ status: 401 }));
    const hub = await withToken();
    hub.reportProgress("started", { ref: "a" });
    await vi.advanceTimersByTimeAsync(2000);
    hub.reportProgress("score", { ref: "a", value: 1, max: 2 });
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reporting before init, or without details, never throws", async () => {
    const hub = await load();
    expect(() => hub.reportProgress("started")).not.toThrow();
    await withToken();
  });
});
