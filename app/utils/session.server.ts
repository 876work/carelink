import { createCookieSessionStorage, redirect } from '@remix-run/node';
import type { UserRole } from '~/types';

type SessionUser = {
  id: string;
  role: UserRole;
};

const sessionSecret = process.env.SESSION_SECRET ?? 'carelink-dev-secret';

const storage = createCookieSessionStorage({
  cookie: {
    name: '__carelink',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    secrets: [sessionSecret],
  },
});

export async function getSession(request: Request) {
  return storage.getSession(request.headers.get('Cookie'));
}

export async function commitSession(session: Awaited<ReturnType<typeof getSession>>) {
  return storage.commitSession(session);
}

export async function destroySession(session: Awaited<ReturnType<typeof getSession>>) {
  return storage.destroySession(session);
}

export async function requireUser(request: Request, role?: UserRole) {
  const session = await getSession(request);
  const user = session.get('user') as SessionUser | undefined;

  if (!user) throw redirect('/login');
  if (role && user.role !== role) throw redirect(`/dashboard/${user.role}`);

  return user;
}

export async function createUserSession(request: Request, user: SessionUser) {
  const session = await getSession(request);
  session.set('user', user);
  return redirect(`/dashboard/${user.role}`, {
    headers: {
      'Set-Cookie': await commitSession(session),
    },
  });
}
