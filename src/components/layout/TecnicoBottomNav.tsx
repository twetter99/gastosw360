'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, PlusCircle, FileText, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  {
    href: '/dashboard',
    icon: Home,
    label: 'Inicio',
  },
  {
    href: '/registros',
    icon: PlusCircle,
    label: 'Registrar',
    matchPaths: ['/registros/horas', '/registros/gastos'],
  },
  {
    href: '/mis-registros',
    icon: FileText,
    label: 'Resumen',
  },
  {
    href: '/perfil',
    icon: User,
    label: 'Perfil',
  },
];

export default function TecnicoBottomNav() {
  const pathname = usePathname();

  const isActive = (item: typeof navItems[0]) => {
    if (item.matchPaths) {
      return item.matchPaths.some(path => pathname.startsWith(path));
    }
    return pathname === item.href || pathname.startsWith(item.href + '/');
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 pb-safe lg:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {navItems.map((item) => {
          const active = isActive(item);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full transition-colors",
                active ? "text-primary" : "text-gray-500"
              )}
            >
              <Icon className={cn(
                "w-6 h-6 mb-1",
                active && "stroke-[2.5px]"
              )} />
              <span className={cn(
                "text-xs font-medium",
                active && "font-semibold"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
