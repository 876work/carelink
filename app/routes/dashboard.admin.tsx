import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { Form, useLoaderData } from '@remix-run/react';
import { getPendingBabysitters } from '~/lib/data.server';
import { supabaseServer } from '~/lib/supabase.server';
import { requireUser } from '~/utils/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request, 'admin');
  const pending = await getPendingBabysitters();
  return json({ pending });
}

export async function action({ request }: ActionFunctionArgs) {
  await requireUser(request, 'admin');
  const form = await request.formData();
  const babysitterId = String(form.get('babysitterId'));
  const decision = String(form.get('decision'));

  const isApproved = decision === 'approve';
  const { error } = await supabaseServer
    .from('babysitter_profiles')
    .update({ is_approved: isApproved })
    .eq('id', babysitterId);

  if (error) return json({ error: error.message }, { status: 400 });
  return json({ ok: true });
}

export default function AdminDashboard() {
  const { pending } = useLoaderData<typeof loader>();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <div className="card">
        <h2 className="mb-4 text-xl font-semibold">Pending Babysitter Approvals</h2>
        {pending.length === 0 ? <p className="text-slate-600">No pending babysitters to review.</p> : (
          <ul className="space-y-3">
            {pending.map((item: any) => (
              <li key={item.id} className="rounded border p-3">
                <p className="font-semibold">{item.profiles.full_name}</p>
                <p className="text-sm text-slate-600">{item.location}</p>
                <p className="text-sm">{item.bio}</p>
                <Form method="post" className="mt-3 flex gap-2">
                  <input type="hidden" name="babysitterId" value={item.id} />
                  <button name="decision" value="approve" className="btn-primary">Approve</button>
                  <button name="decision" value="reject" className="btn-secondary">Reject</button>
                </Form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
