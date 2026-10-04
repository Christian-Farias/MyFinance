import React from 'react';
import { 
  Utensils, 
  Home, 
  Car, 
  HeartPulse, 
  GraduationCap, 
  Gamepad2, 
  ShoppingBag, 
  Tv, 
  Plane, 
  TrendingUp, 
  Wallet, 
  LineChart, 
  MoreHorizontal, 
  Tag,
  Building2,
  DollarSign,
  Coffee,
  Shield,
  Smartphone
} from 'lucide-react';

interface CategoryIconProps {
  iconName?: string;
  color?: string;
  size?: number;
  className?: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ 
  iconName, 
  color = 'var(--color-ink-faint)', 
  size = 18, 
  className = '' 
}) => {
  const getIcon = () => {
    switch (iconName?.toLowerCase()) {
      case 'utensils':
      case 'alimentacao':
        return <Utensils size={size} />;
      case 'home':
      case 'moradia':
        return <Home size={size} />;
      case 'car':
      case 'transporte':
        return <Car size={size} />;
      case 'heartpulse':
      case 'saude':
        return <HeartPulse size={size} />;
      case 'graduationcap':
      case 'educacao':
        return <GraduationCap size={size} />;
      case 'gamepad2':
      case 'lazer':
        return <Gamepad2 size={size} />;
      case 'shoppingbag':
      case 'compras':
        return <ShoppingBag size={size} />;
      case 'tv':
      case 'assinaturas':
        return <Tv size={size} />;
      case 'plane':
      case 'viagens':
        return <Plane size={size} />;
      case 'trendingup':
      case 'financas':
        return <TrendingUp size={size} />;
      case 'wallet':
      case 'salario':
        return <Wallet size={size} />;
      case 'linechart':
      case 'investimentos':
        return <LineChart size={size} />;
      case 'building2':
        return <Building2 size={size} />;
      case 'coffee':
        return <Coffee size={size} />;
      case 'shield':
        return <Shield size={size} />;
      case 'smartphone':
        return <Smartphone size={size} />;
      case 'dollarsign':
        return <DollarSign size={size} />;
      default:
        return <Tag size={size} />;
    }
  };

  return (
    <div 
      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-transform active:scale-95 ${className}`}
      style={{ 
        backgroundColor: `color-mix(in oklab, ${color} 12%, transparent)`, 
        color: color 
      }}
    >
      {getIcon()}
    </div>
  );
};
