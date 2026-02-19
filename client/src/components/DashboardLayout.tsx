import { ReactNode } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
  participantsBadge?: number;
}

export default function DashboardLayout({ children, participantsBadge }: DashboardLayoutProps) {
  const [location, setLocation] = useLocation();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    setLocation('/login');
  };

  const navItems = [
    { path: '/', label: '대시보드', badge: undefined },
    { path: '/applicant-management', label: '신청자 관리', badge: participantsBadge },
    { path: '/achievements', label: '달성 현황', badge: undefined },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-[230px] shrink-0 bg-card border-r border-border flex flex-col">
        {/* Navigation Menu */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => setLocation(item.path)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm
                    organic-transition
                    ${isActive 
                      ? 'bg-secondary text-foreground font-medium' 
                      : 'text-muted-foreground hover:bg-secondary/50 hover:text-foreground'
                    }
                  `}
                >
                  <span>{item.label}</span>
                  {item.badge && item.badge > 0 && (
                    <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs font-semibold rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="w-full text-xs"
          >
            로그아웃
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-[1200px] mx-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
