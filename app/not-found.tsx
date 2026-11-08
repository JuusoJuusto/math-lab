import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-5">
      <section className="panel max-w-lg p-10 text-center">
        <div className="text-6xl" aria-hidden="true">🧮</div>
        <h1 className="mt-4 font-display text-4xl font-semibold text-slate-800">Tätä sivua ei löydy</h1>
        <p className="mt-3 text-sm text-slate-600">Palataan takaisin matematiikan pariin.</p>
        <Link href="/" className="button-primary mt-6">Etusivulle</Link>
      </section>
    </main>
  );
}
