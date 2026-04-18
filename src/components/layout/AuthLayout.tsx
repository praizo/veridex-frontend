import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Logo } from '@/components/common/Logo';
import veridexBg from '@/assets/veridex-bg.jpg';

export function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-background">
      <div className="relative hidden w-0 flex-3 lg:block overflow-hidden">
        <img
          src={veridexBg}
          alt="Auth Background"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-b from-primary/30 to-slate-950/80" />
        <div className="absolute bottom-12 left-12 z-20 max-w-xl">
          <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-md">Nigeria's National e-Invoicing Infrastructure.</h2>
          <p className="text-lg text-white/80 drop-shadow">Secure, compliant, and enterprise-grade invoice transmission platform built to NRS/MBS specifications.</p>
        </div>
      </div>
      <div className="flex flex-2 flex-col justify-center px-4 py-12 sm:px-6 lg:px-16 ">
        <div className="w-full">
          <a href="/" className="mb-10 block">
            <Logo className="text-primary scale-110 origin-left" />
          </a>
          <Outlet />
        </div>
      </div>
    </div>
  );
}
