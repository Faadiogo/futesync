import { Home, Calendar, Plus, Users, User } from "lucide-react";
import { useLocation } from "wouter";

export default function Navigation() {
  const [location, setLocation] = useLocation();

  const navItems = [
    { key: "home", label: "Início", icon: Home, path: "/" },
    { key: "matches", label: "Partidas", icon: Calendar, path: "/matches" },
    { key: "create", label: "", icon: Plus, path: "/create-match", isSpecial: true },
    { key: "social", label: "Social", icon: Users, path: "/social" },
    { key: "profile", label: "Perfil", icon: User, path: "/profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 lg:hidden">
      <div className="grid grid-cols-5 h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          if (item.isSpecial) {
            return (
              <button
                key={item.key}
                onClick={() => setLocation(item.path)}
                className="flex flex-col items-center justify-center"
              >
                <div className="bg-primary rounded-full w-10 h-10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-white" />
                </div>
              </button>
            );
          }

          return (
            <button
              key={item.key}
              onClick={() => setLocation(item.path)}
              className={`flex flex-col items-center justify-center space-y-1 ${
                active ? "text-primary nav-item-active" : "text-slate-600"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "text-primary" : ""}`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
