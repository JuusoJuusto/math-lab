import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="panel max-w-lg p-10 text-center">
        <div className="text-6xl" aria-hidden="true">🧮</div>
        <h1 className="mt-4 font-display text-4xl font-semibold text-slate-800">Page not found</h1>
        <p className="mt-3 text-sm text-slate-600">This page is not part of the learning path. Let&apos;s get you back to mathematics.</p>
        <Link href="/" className="button-primary mt-6">Back to MathLab</Link>
      </section>
    </main>
  );
}