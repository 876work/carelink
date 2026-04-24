import { json, redirect, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { supabaseServer } from '~/lib/supabase.server';
import { requireUser } from '~/utils/session.server';

export async function loader({ request }: LoaderFunctionArgs) {
  await requireUser(request, 'babysitter');
  return json({ ok: true });
}

export async function action({ request }: ActionFunctionArgs) {
  const user = await requireUser(request, 'babysitter');
  const form = await request.formData();

  const bio = String(form.get('bio') || '');
  const location = String(form.get('location') || '');
  const hourlyRate = Number(form.get('hourlyRate') || 0);
  const govId = form.get('govId') as File | null;
  const selfie = form.get('selfie') as File | null;

  if (!bio || !location || !hourlyRate || !govId || !selfie) {
    return json({ error: 'All fields and both images are required.' }, { status: 400 });
  }

  const { data: profileData, error: profileError } = await supabaseServer.from('babysitter_profiles').insert({
    profile_id: user.id,
    bio,
    location,
    hourly_rate: hourlyRate,
    is_approved: false,
  }).select('id').single<{ id: string }>();

  if (profileError || !profileData) {
    return json({ error: profileError?.message ?? 'Could not create profile' }, { status: 400 });
  }

  const govPath = `${user.id}/gov-id-${Date.now()}`;
  const selfiePath = `${user.id}/selfie-${Date.now()}`;

  const [govUpload, selfieUpload] = await Promise.all([
    supabaseServer.storage.from('verification-docs').upload(govPath, govId),
    supabaseServer.storage.from('verification-docs').upload(selfiePath, selfie),
  ]);

  if (govUpload.error || selfieUpload.error) {
    return json({ error: govUpload.error?.message ?? selfieUpload.error?.message ?? 'Upload failed' }, { status: 400 });
  }

  const { error: docError } = await supabaseServer.from('verification_documents').insert([
    { babysitter_profile_id: profileData.id, doc_type: 'government_id', file_path: govPath },
    { babysitter_profile_id: profileData.id, doc_type: 'selfie', file_path: selfiePath },
  ]);

  if (docError) return json({ error: docError.message }, { status: 400 });

  return redirect('/dashboard/babysitter');
}

export default function NewBabysitterProfilePage() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="mx-auto max-w-2xl card">
      <h1 className="mb-4 text-2xl font-semibold">Create Babysitter Profile</h1>
      <Form method="post" encType="multipart/form-data" className="space-y-4">
        <textarea name="bio" className="input min-h-24" placeholder="Tell families about your experience" required />
        <input name="location" className="input" placeholder="Location (e.g. Bridgetown, Barbados)" required />
        <input type="number" name="hourlyRate" min={1} className="input" placeholder="Hourly rate (USD)" required />
        <div>
          <label className="mb-1 block text-sm">Government ID image</label>
          <input type="file" name="govId" accept="image/*" required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Selfie image</label>
          <input type="file" name="selfie" accept="image/*" required />
        </div>
        {actionData?.error ? <p className="text-sm text-red-600">{actionData.error}</p> : null}
        <button className="btn-primary" type="submit">Submit for Review</button>
      </Form>
    </div>
  );
}
