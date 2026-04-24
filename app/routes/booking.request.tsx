import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { Form, useActionData, useSearchParams } from '@remix-run/react';
import { supabaseServer } from '~/lib/supabase.server';
import { requireUser } from '~/utils/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request, 'parent');
  return json({ ok: true });
}

export async function action({ request }: ActionFunctionArgs) {
  const parent = await requireUser(request, 'parent');
  const form = await request.formData();
  const babysitterId = String(form.get('babysitterId') || '');
  const bookingDate = String(form.get('bookingDate') || '');
  const notes = String(form.get('notes') || '');

  if (!babysitterId || !bookingDate) return json({ error: 'Babysitter and date are required.' }, { status: 400 });

  const { data, error } = await supabaseServer.from('bookings').insert({
    parent_id: parent.id,
    babysitter_id: babysitterId,
    booking_date: bookingDate,
    notes,
    status: 'pending',
  }).select('id').single<{ id: string }>();

  if (error || !data) return json({ error: error?.message ?? 'Could not create booking request.' }, { status: 400 });
  return redirect(`/booking/${data.id}`);
}

export default function BookingRequestPage() {
  const actionData = useActionData<typeof action>();
  const [params] = useSearchParams();

  return (
    <div className="mx-auto max-w-xl card">
      <h1 className="mb-4 text-2xl font-semibold">New Booking Request</h1>
      <Form method="post" className="space-y-4">
        <input type="hidden" name="babysitterId" value={params.get('babysitterId') || ''} />
        <input type="date" name="bookingDate" className="input" required />
        <textarea name="notes" className="input min-h-24" placeholder="Any additional details" />
        {actionData?.error ? <p className="text-sm text-red-600">{actionData.error}</p> : null}
        <button className="btn-primary" type="submit">Send Request</button>
      </Form>
    </div>
  );
}
