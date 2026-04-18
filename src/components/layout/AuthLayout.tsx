import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Building2 } from 'lucide-react';
import heroImage from '@/assets/hero.png';

export function AuthLayout() {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="flex min-h-screen bg-background">
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 border-r border-border/40 shadow-2xl z-10 bg-card">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <a href="/" className="flex items-center gap-2 mb-8 font-bold text-2xl tracking-tighter">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-lg shadow-primary/20">
              <Building2 className="size-5" />
            </div>
            Veridex
          </a>
          <Outlet />
        </div>
      </div>
      <div className="relative hidden w-0 flex-1 lg:block bg-muted overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent z-10" />
        <img 
          className="absolute inset-0 h-full w-full object-cover opacity-90 transition-transform duration-1000 hover:scale-105" 
          src={heroImage} 
          alt="Dashboard UI Inspiration" 
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1554774853-719586f82d77?q=80&w=2940&auto=format&fit=crop';
          }}
        />
        <div className="absolute bottom-12 left-12 z-20 max-w-xl">
           <h2 className="text-4xl font-bold text-white mb-4 drop-shadow-md">Enterprise E-Invoicing for Nigeria.</h2>
           <p className="text-lg text-white/80 drop-shadow">Seamlessly integrate your business with the FIRS NRS portal. Ensure full compliance with robust APIs and beautiful interfaces.</p>
        </div>
      </div>
    </div>
  );
}
