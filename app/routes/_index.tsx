import { Link } from '@remix-run/react';

export default function LandingPage() {
  return (
    <section className="grid gap-8 md:grid-cols-2 md:items-center">
      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-coral">Trusted care across the Caribbean</p>
        <h1 className="mb-4 text-4xl font-bold text-palm">Find verified babysitters you can rely on.</h1>
        <p className="mb-6 text-slate-700">CareLink Caribbean connects families with vetted, admin-approved babysitters in a simple and safe marketplace.</p>
        <div className="flex gap-3">
          <Link to="/signup" className="btn-primary">Get Started</Link>
          <Link to="/search" className="btn-secondary">Browse Sitters</Link>
        </div>
      </div>
      <div className="card">
        <h2 className="mb-4 text-xl font-semibold">How it works</h2>
        <ol className="space-y-3 text-sm text-slate-700">
          <li>1. Parents sign up and browse approved babysitters.</li>
          <li>2. Babysitters submit profile + verification documents.</li>
          <li>3. Admin reviews and approves trusted caregivers.</li>
          <li>4. Parents send booking requests directly in-app.</li>
        </ol>
      </div>
    </section>
  );
}
