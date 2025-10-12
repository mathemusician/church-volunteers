import { signIn, auth } from '@/auth';
import { redirect } from 'next/navigation';

export default async function SignInPage() {
  const session = await auth();

  // If already signed in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">Volunteer Management System</p>
          <p className="mt-2 text-center text-xs text-gray-500">
            New user? You'll be able to create an account on the next screen.
          </p>
        </div>
        <form
          action={async () => {
            'use server';
            await signIn('zitadel', { redirectTo: '/dashboard' });
          }}
          className="mt-8 space-y-6"
        >
          <button
            type="submit"
            className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Sign in with ZITADEL
          </button>
        </form>
      </div>
    </div>
  );
}
