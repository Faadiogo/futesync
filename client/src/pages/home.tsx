import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Bell, Check, Trophy, Star, Users, Calendar } from "lucide-react";
import { Link } from "wouter";

interface Match {
  id: string;
  title: string;
  location: string;
  date: string;
  maxPlayers: number;
  status: string;
  createdBy: string;
}

interface UserStats {
  totalMatches: number;
  totalGoals: number;
  totalAssists: number;
  averageRating: number;
  attendanceRate: number;
}

export default function Home() {
  const { user } = useAuth();
  
  const { data: matches = [], isLoading: matchesLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/users", user?.id, "stats"],
    enabled: !!user?.id,
  });

  const upcomingMatches = matches
    .filter(match => new Date(match.date) > new Date() && match.status === 'scheduled')
    .slice(0, 3);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 lg:hidden">
              <i className="fas fa-futbol text-primary mr-2"></i>
              SportSync
            </h1>
            <h1 className="hidden lg:block text-2xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-600">Bem-vindo, {user?.name}!</p>
          </div>
          <Button variant="ghost" size="sm" className="relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
              3
            </Badge>
          </Button>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {statsLoading ? "..." : `${Math.round(userStats?.attendanceRate || 0)}%`}
                  </p>
                  <p className="text-sm text-slate-600">Presença</p>
                </div>
                <div className="bg-primary-100 rounded-lg p-2">
                  <Check className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {statsLoading ? "..." : userStats?.totalMatches || 0}
                  </p>
                  <p className="text-sm text-slate-600">Partidas</p>
                </div>
                <div className="bg-blue-100 rounded-lg p-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {statsLoading ? "..." : userStats?.totalGoals || 0}
                  </p>
                  <p className="text-sm text-slate-600">Gols</p>
                </div>
                <div className="bg-yellow-100 rounded-lg p-2">
                  <Trophy className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-slate-900">
                    {statsLoading ? "..." : userStats?.averageRating?.toFixed(1) || "0.0"}
                  </p>
                  <p className="text-sm text-slate-600">Avaliação</p>
                </div>
                <div className="bg-yellow-100 rounded-lg p-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Próximas Partidas */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Próximas Partidas</h2>
            <Link href="/matches">
              <Button variant="ghost" size="sm" className="text-primary">
                Ver todas
              </Button>
            </Link>
          </div>
          
          {matchesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-16 bg-slate-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingMatches.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">Nenhuma partida agendada</p>
                <Link href="/create-match">
                  <Button className="mt-4">Criar Nova Partida</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingMatches.map((match) => {
                const { day, time } = formatDate(match.date);
                return (
                  <Card key={match.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="bg-primary-100 rounded-lg p-2">
                            <Calendar className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-900">{match.title}</h3>
                            <p className="text-sm text-slate-600">{match.location}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-900">{day}</p>
                          <p className="text-sm text-slate-600">{time}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-slate-600">0 confirmados</span>
                          <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                              <span className="text-xs font-medium text-slate-600">+0</span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm">Confirmar</Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section>
          <h2 className="text-xl font-semibold text-slate-900 mb-4">Atividade Recente</h2>
          <div className="space-y-3">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src="" />
                    <AvatarFallback>
                      <Users className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">
                      Bem-vindo ao SportSync! Comece criando sua primeira partida.
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Agora mesmo</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
