import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Settings, Edit, BarChart3, LogOut, Check, Star, Trophy, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface UserStats {
  totalMatches: number;
  totalGoals: number;
  totalAssists: number;
  averageRating: number;
  attendanceRate: number;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  date: string;
  icon: string;
}

export default function Profile() {
  const { user, logout } = useAuth();

  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/users", user?.id, "stats"],
    enabled: !!user?.id,
  });

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (days: number) => {
    if (days === 0) return "Hoje";
    if (days === 1) return "Ontem";
    if (days < 7) return `${days} dias atrás`;
    if (days < 30) return `${Math.floor(days / 7)} semanas atrás`;
    return `${Math.floor(days / 30)} meses atrás`;
  };

  // Mock recent activities for now
  const recentActivities: Activity[] = [
    {
      id: "1",
      type: "match",
      description: "Participou da partida 'Racha de Quinta'",
      date: "2",
      icon: "football"
    },
    {
      id: "2", 
      type: "confirmation",
      description: "Confirmou presença em 'Pelada do Sábado'",
      date: "3",
      icon: "check"
    },
    {
      id: "3",
      type: "rating",
      description: "Recebeu avaliação 8.5 na última partida",
      date: "7",
      icon: "star"
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "match":
        return <Calendar className="h-4 w-4 text-primary" />;
      case "confirmation":
        return <Check className="h-4 w-4 text-green-600" />;
      case "rating":
        return <Star className="h-4 w-4 text-yellow-600" />;
      default:
        return <Calendar className="h-4 w-4 text-slate-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Meu Perfil</h1>
            <p className="text-sm text-slate-600">Gerencie suas informações</p>
          </div>
          <Button variant="ghost" size="sm" className="text-slate-600">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Profile Card */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <Avatar className="w-20 h-20">
                <AvatarImage src={user?.photoUrl} />
                <AvatarFallback className="bg-primary text-white text-2xl">
                  {user?.name ? getUserInitials(user.name) : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900">{user?.name || "Usuário"}</h2>
                <p className="text-slate-600">{user?.position || "Jogador"}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary" className="bg-primary-100 text-primary">
                    {user?.role === "player" ? "Jogador" : user?.role === "moderator" ? "Moderador" : "Admin"}
                  </Badge>
                  <span className="text-slate-500 text-sm">Desde Nov 2023</span>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {statsLoading ? "..." : userStats?.totalMatches || 0}
                </p>
                <p className="text-xs text-slate-600">Partidas</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {statsLoading ? "..." : userStats?.totalGoals || 0}
                </p>
                <p className="text-xs text-slate-600">Gols</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {statsLoading ? "..." : userStats?.totalAssists || 0}
                </p>
                <p className="text-xs text-slate-600">Assistências</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900">
                  {statsLoading ? "..." : userStats?.averageRating?.toFixed(1) || "0.0"}
                </p>
                <p className="text-xs text-slate-600">Avaliação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Stats */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Desempenho</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Taxa de Presença</span>
                  <span className="text-sm font-bold text-primary">
                    {statsLoading ? "..." : `${Math.round(userStats?.attendanceRate || 0)}%`}
                  </span>
                </div>
                <Progress 
                  value={userStats?.attendanceRate || 0} 
                  className="h-2"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Confiabilidade</span>
                  <span className="text-sm font-bold text-green-600">92%</span>
                </div>
                <Progress value={92} className="h-2" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">Avaliação Média</span>
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    <span className="text-sm font-bold text-slate-900">
                      {statsLoading ? "..." : userStats?.averageRating?.toFixed(1) || "0.0"}
                    </span>
                  </div>
                </div>
                <Progress 
                  value={(userStats?.averageRating || 0) * 10} 
                  className="h-2" 
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Atividade Recente</h3>
            
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-center space-x-3">
                  <div className="bg-slate-100 rounded-lg p-2 w-10 h-10 flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">{activity.description}</p>
                    <p className="text-xs text-slate-500">{formatDate(parseInt(activity.date))}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white">
            <Edit className="h-4 w-4 mr-2" />
            Editar Perfil
          </Button>
          <Button variant="outline" className="w-full">
            <BarChart3 className="h-4 w-4 mr-2" />
            Ver Estatísticas Completas
          </Button>
          <Button 
            variant="outline" 
            className="w-full text-red-600 border-red-200 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
}
