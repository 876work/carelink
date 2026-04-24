import { Form, useActionData } from '@remix-run/react';
import { json, type ActionFunctionArgs } from '@remix-run/node';
import { supabaseServer } from '~/lib/supabase.server';
import { createUserSession } from '~/utils/session.server';

export async function action({ request }: ActionFunctionArgs) {
  const form = await request.formData();
  const email = String(form.get('email') || '');
  const password = String(form.get('password') || '');

  if (!email || !password) {
    return json({ error: 'Email and password are required.' }, { status: 400 });
  }

  const { data, error } = await supabaseServer.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return json({ error: error?.message ?? 'Invalid credentials.' }, { status: 401 });
  }

  const { data: profile, error: profileError } = await supabaseServer
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single<{ role: 'parent' | 'babysitter' | 'admin' }>();

  if (profileError || !profile) {
    return json({ error: 'Profile not found.' }, { status: 404 });
  }

  return createUserSession(request, { id: data.user.id, role: profile.role });
}

export default function LoginPage() {
  const actionData = useActionData<typeof action>();

  return (
    <div className="mx-auto max-w-md card">
      <h1 className="mb-4 text-2xl font-semibold">Welcome back</h1>
      <Form method="post" className="space-y-4">
        <div>
          <label className="mb-1 block text-sm">Email</label>
          <input type="email" name="email" className="input" required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Password</label>
          <input type="password" name="password" className="input" required />
        </div>
        {actionData?.error ? <p className="text-sm text-red-600">{actionData.error}</p> : null}
        <button className="btn-primary w-full" type="submit">Login</button>
      </Form>
    </div>
  );
}
