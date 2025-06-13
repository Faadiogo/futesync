import { Home, Calendar, Users, User } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user } = useAuth();

  const navItems = [
    { key: "home", label: "Início", icon: Home, path: "/" },
    { key: "matches", label: "Partidas", icon: Calendar, path: "/matches" },
    { key: "social", label: "Rede Social", icon: Users, path: "/social" },
    { key: "profile", label: "Perfil", icon: User, path: "/profile" },
  ];

  const isActive = (path: string) => {
    if (path === "/" && location === "/") return true;
    if (path !== "/" && location.startsWith(path)) return true;
    return false;
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <aside className="hidden lg:fixed lg:left-0 lg:top-0 lg:bottom-0 lg:w-64 lg:bg-white lg:border-r lg:border-slate-200 lg:flex lg:flex-col z-40">
      <div className="p-6 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-slate-900">
          <span className="text-primary mr-2">⚽</span>
          SportSync
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <button
              key={item.key}
              onClick={() => setLocation(item.path)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                active 
                  ? "bg-primary-50 text-primary nav-item-desktop-active" 
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-slate-200">
        <div className="flex items-center space-x-3">
          <Avatar className="w-10 h-10">
            <AvatarImage src={user?.photoUrl} />
            <AvatarFallback className="bg-primary text-white">
              {user?.name ? getUserInitials(user.name) : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{user?.name || "Usuário"}</p>
            <p className="text-xs text-slate-500">
              {user?.role === "player" ? "Jogador" : user?.role === "moderator" ? "Moderador" : "Admin"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
