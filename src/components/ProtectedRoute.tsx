import React from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthPage } from '../pages/AuthPage';

export const ProtectedRoute: React.FC = () => {
  const { user, isLoading, isBypassed } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#050505] flex flex-col items-center justify-center p-4">
        <div className="relative mb-4">
          <div className="absolute -inset-2 bg-gradient-to-r from-[#8B7CFF] to-[#6366F1] rounded-3xl blur-md opacity-25 animate-pulse" />
          <img
            src="/logo.png"
            alt="Carregando..."
            className="relative w-14 h-14 rounded-2xl object-contain bg-black border border-[#222733] shadow-lg"
          />
        </div>
        <div className="w-5 h-5 border-2 border-[#8B7CFF] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user && !isBypassed) {
    return <AuthPage />;
  }

  return <Outlet />;
};
