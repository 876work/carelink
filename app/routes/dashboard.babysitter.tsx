import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { getBabysitterProfile, getBookingsForUser } from '~/lib/data.server';
import { requireUser } from '~/utils/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request, 'babysitter');
  const profile = await getBabysitterProfile(user.id);
  const bookings = await getBookingsForUser(user.id, 'babysitter');
  return json({ profile, bookings });
}

export default function BabysitterDashboard() {
  const { profile, bookings } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Babysitter Dashboard</h1>
      <div className="card">
        <h2 className="mb-2 text-xl font-semibold">Approval Status</h2>
        {!profile ? (
          <div>
            <p className="mb-3 text-slate-600">You have not created your babysitter profile yet.</p>
            <Link className="btn-primary" to="/babysitter/profile/new">Create Profile</Link>
          </div>
        ) : profile.is_approved ? (
          <p className="text-palm">Approved ✅ You are visible to parents.</p>
        ) : (
          <p className="text-coral">Pending review. You'll appear in search after admin approval.</p>
        )}
      </div>

      <div className="card">
        <h2 className="mb-2 text-xl font-semibold">Incoming Booking Requests</h2>
        {bookings.length === 0 ? <p className="text-slate-600">No booking requests yet.</p> : (
          <ul className="space-y-2">
            {bookings.map((b: any) => (
              <li key={b.id}><Link to={`/booking/${b.id}`} className="text-lagoon underline">Booking #{b.id} - {b.status}</Link></li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
