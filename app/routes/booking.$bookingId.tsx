import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { supabaseServer } from '~/lib/supabase.server';
import { requireUser } from '~/utils/session.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  const bookingId = params.bookingId;

  const { data, error } = await supabaseServer.from('bookings').select('*').eq('id', bookingId).single();
  if (error || !data) throw new Response('Booking not found', { status: 404 });

  const allowed = data.parent_id === user.id || data.babysitter_id === user.id || user.role === 'admin';
  if (!allowed) throw new Response('Forbidden', { status: 403 });

  return json({ booking: data, role: user.role });
}

export async function action({ request, params }: ActionFunctionArgs) {
  const user = await requireUser(request, 'babysitter');
  const form = await request.formData();
  const decision = String(form.get('decision'));
  const status = decision === 'accept' ? 'accepted' : 'rejected';

  const { error } = await supabaseServer
    .from('bookings')
    .update({ status })
    .eq('id', params.bookingId)
    .eq('babysitter_id', user.id);

  if (error) return json({ error: error.message }, { status: 400 });
  return json({ ok: true });
}

export default function BookingDetailsPage() {
  const { booking, role } = useLoaderData<typeof loader>();

  return (
    <div className="mx-auto max-w-2xl card">
      <h1 className="mb-3 text-2xl font-semibold">Booking Details</h1>
      <p><strong>Status:</strong> {booking.status}</p>
      <p><strong>Date:</strong> {booking.booking_date}</p>
      <p><strong>Notes:</strong> {booking.notes || 'No notes provided'}</p>
      {role === 'babysitter' && booking.status === 'pending' ? (
        <Form method="post" className="mt-4 flex gap-2">
          <button className="btn-primary" name="decision" value="accept">Accept</button>
          <button className="btn-secondary" name="decision" value="reject">Reject</button>
        </Form>
      ) : null}
    </div>
  );
}
