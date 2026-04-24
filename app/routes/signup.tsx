import { Form, useActionData } from '@remix-run/react';
import { json, redirect, type ActionFunctionArgs } from '@remix-run/node';
import { supabaseServer } from '~/lib/supabase.server';

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const email = String(form.get('email') || '');
  const password = String(form.get('password') || '');
  const fullName = String(form.get('fullName') || '');
  const role = String(form.get('role') || 'parent');

  if (!email || !password || !fullName) {
    return json({ error: 'All fields are required.' }, { status: 400 });
  }

  const { data, error } = await supabaseServer.auth.signUp({ email, password });
  if (error || !data.user) return json({ error: error?.message ?? 'Unable to sign up.' }, { status: 400 });

  const { error: profileError } = await supabaseServer.from('profiles').insert({
    id: data.user.id,
    full_name: fullName,
    role,
  });

  if (profileError) {
    return json({ error: profileError.message }, { status: 400 });
  }

  return redirect('/login');
}

export default function SignupPage() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="mx-auto max-w-md card">
      <h1 className="mb-4 text-2xl font-semibold">Create your account</h1>
      <Form method="post" className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Full name</label>
          <input name="fullName" className="input" required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input type="email" name="email" className="input" required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <input type="password" name="password" className="input" minLength={6} required />
        </div>
        <div>
          <label className="mb-1 block text-sm">I am a...</label>
          <select name="role" className="input">
            <option value="parent">Parent</option>
            <option value="babysitter">Babysitter</option>
          </select>
        </div>
        {actionData?.error ? <p className="text-sm text-red-600">{actionData.error}</p> : null}
        <button className="btn-primary w-full" type="submit">Sign up</button>
      </Form>
    </div>
  );
}
