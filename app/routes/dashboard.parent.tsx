import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { getBookingsForUser } from '~/lib/data.server';
import { requireUser } from '~/utils/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request, 'parent');
  const bookings = await getBookingsForUser(user.id, 'parent');
  return json({ bookings });
}

export default function ParentDashboard() {
  const { bookings } = useLoaderData<typeof loader>();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Parent Dashboard</h1>
        <Link to="/search" className="btn-primary">Find Babysitters</Link>
      </div>
      <div className="card">
        <h2 className="mb-3 text-xl font-semibold">Your Booking Requests</h2>
        {bookings.length === 0 ? (
          <p className="text-slate-600">No bookings yet. Start by browsing approved babysitters.</p>
        ) : (
          <ul className="space-y-2">
            {bookings.map((b: any) => (
              <li key={b.id}><Link className="text-lagoon underline" to={`/booking/${b.id}`}>Booking #{b.id} - {b.status}</Link></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
