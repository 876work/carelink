import { json, type LoaderFunctionArgs } from '@remix-run/node';
import { Link, useLoaderData } from '@remix-run/react';
import { getApprovedBabysitters } from '~/lib/data.server';

export async function loader({}: LoaderFunctionArgs) {
  const babysitters = await getApprovedBabysitters();
  return json({ babysitters });
}

export default function SearchPage() {
  const { babysitters } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Approved Babysitters</h1>
      {babysitters.length === 0 ? <div className="card"><p>No approved babysitters yet. Check back soon.</p></div> : (
        <ul className="grid gap-4 md:grid-cols-2">
          {babysitters.map((sitter: any) => (
            <li key={sitter.id} className="card">
              <h2 className="text-xl font-semibold">{sitter.profiles.full_name}</h2>
              <p className="text-sm text-slate-600">{sitter.location}</p>
              <p className="my-2 text-sm">{sitter.bio}</p>
              <p className="mb-3 font-medium">${sitter.hourly_rate}/hr</p>
              <Link to={`/booking/request?babysitterId=${sitter.profile_id}`} className="btn-primary">Request Booking</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
