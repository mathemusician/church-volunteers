import { signIn, auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Sign In - Volunteers',
  description: 'Sign in to manage your volunteers and events',
};

export default async function SignInPage() {
  const session = await auth();

  // If already signed in, redirect to dashboard
  if (session) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 px-4 py-12">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-2 animate-[fadeIn_0.5s_ease-in]">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Volunteers
          </h1>
          <p className="text-gray-600 text-sm">Volunteer Management System</p>
        </div>

        {/* Sign in card */}
        <div className="bg-white rounded-2xl shadow-lg p-8 space-y-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300 animate-[slideUp_0.6s_ease-out]">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
            <p className="text-sm text-gray-600">Sign in to manage your volunteers and events</p>
          </div>

          <form
            action={async () => {
              'use server';
              await signIn('zitadel', { redirectTo: '/dashboard' });
            }}
          >
            <button
              type="submit"
              className="group w-full flex justify-center items-center gap-3 rounded-xl bg-blue-600 px-6 py-4 text-base font-semibold text-white shadow-sm hover:bg-blue-700 hover:shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              <svg
                className="w-5 h-5 transition-transform group-hover:rotate-12"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
              </svg>
              <span className="group-hover:tracking-wide transition-all duration-200">
                Continue with Secure Sign In
              </span>
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">New to Volunteers?</span>
            </div>
          </div>

          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 hover:border-blue-200 transition-colors duration-200">
            <p className="text-sm text-gray-700 text-center">
              <span className="font-semibold text-blue-700">First time here?</span> Click the button
              above to create your account on the next screen.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center animate-[fadeIn_0.8s_ease-in]">
          <div className="flex items-center justify-center gap-4 text-xs text-gray-500">
            <a
              href="/privacy"
              className="hover:text-blue-600 hover:underline transition-all duration-200"
            >
              Privacy
            </a>
            <span>•</span>
            <a
              href="/terms"
              className="hover:text-blue-600 hover:underline transition-all duration-200"
            >
              Terms
            </a>
            <span>•</span>
            <span>© 2025 Volunteers</span>
          </div>
        </div>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `,
        }}
      />
    </div>
  );
}
