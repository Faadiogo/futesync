import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, MapPin, Users, Play, Plus, Share } from "lucide-react";
import { Link } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Match {
  id: string;
  title: string;
  description?: string;
  location: string;
  date: string;
  maxPlayers: number;
  status: string;
  isPublic: boolean;
  createdBy: string;
}

interface Confirmation {
  id: string;
  userId: string;
  matchId: string;
  confirmed: boolean;
  attended: boolean;
}

export default function Matches() {
  const [activeFilter, setActiveFilter] = useState("all");
  const { toast } = useToast();

  const { data: matches = [], isLoading } = useQuery<Match[]>({
    queryKey: ["/api/matches"],
  });

  const confirmMutation = useMutation({
    mutationFn: async (matchId: string) => {
      return await apiRequest("POST", `/api/matches/${matchId}/confirm`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({
        title: "Presença confirmada!",
        description: "Sua presença foi confirmada com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível confirmar sua presença.",
        variant: "destructive",
      });
    },
  });

  const filteredMatches = matches.filter(match => {
    if (activeFilter === "all") return true;
    if (activeFilter === "scheduled") return match.status === "scheduled";
    if (activeFilter === "in_progress") return match.status === "in_progress";
    if (activeFilter === "finished") return match.status === "finished";
    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' }),
      time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      scheduled: { label: "Agendada", variant: "default" as const, className: "bg-blue-100 text-blue-700" },
      in_progress: { label: "Em Andamento", variant: "default" as const, className: "bg-green-100 text-green-700 animate-pulse" },
      finished: { label: "Finalizada", variant: "secondary" as const, className: "bg-slate-100 text-slate-700" },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.scheduled;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const filters = [
    { key: "all", label: "Todas" },
    { key: "scheduled", label: "Agendadas" },
    { key: "in_progress", label: "Em Andamento" },
    { key: "finished", label: "Finalizadas" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Partidas</h1>
          <p className="text-sm text-slate-600">Gerencie suas partidas</p>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Filter Tabs */}
        <div className="flex space-x-2 overflow-x-auto">
          {filters.map(filter => (
            <Button
              key={filter.key}
              variant={activeFilter === filter.key ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(filter.key)}
              className={`whitespace-nowrap ${
                activeFilter === filter.key 
                  ? "bg-primary text-white" 
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {/* Create Match Button */}
        <Link href="/create-match">
          <Button className="w-full bg-primary hover:bg-primary/90 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Criar Nova Partida
          </Button>
        </Link>

        {/* Matches List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="h-32 bg-slate-200 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMatches.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">
                  {activeFilter === "all" 
                    ? "Nenhuma partida encontrada" 
                    : `Nenhuma partida ${filters.find(f => f.key === activeFilter)?.label.toLowerCase()}`
                  }
                </p>
                <Link href="/create-match">
                  <Button>Criar Primeira Partida</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            filteredMatches.map((match) => {
              const { day, time } = formatDate(match.date);
              return (
                <Card key={match.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-primary-100 rounded-lg p-3">
                          {match.status === "in_progress" ? (
                            <Play className="h-5 w-5 text-green-600" />
                          ) : (
                            <Calendar className="h-5 w-5 text-primary" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900">{match.title}</h3>
                          <div className="flex items-center space-x-2 text-sm text-slate-600">
                            <MapPin className="h-4 w-4" />
                            <span>{match.location}</span>
                          </div>
                          <p className="text-sm text-slate-500">{day} • {time}</p>
                        </div>
                      </div>
                      {getStatusBadge(match.status)}
                    </div>

                    <div className="space-y-3">
                      {/* Attendance Progress */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">Confirmações</span>
                          <span className="text-sm text-slate-600">0/{match.maxPlayers}</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div className="bg-primary h-2 rounded-full" style={{ width: "0%" }}></div>
                        </div>
                      </div>

                      {/* Player Avatars */}
                      <div className="flex items-center justify-between">
                        <div className="flex -space-x-2">
                          <div className="w-8 h-8 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center">
                            <span className="text-xs font-medium text-slate-600">+0</span>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary">
                          Ver detalhes
                        </Button>
                      </div>

                      {/* Action Buttons */}
                      {match.status === "scheduled" && (
                        <div className="flex space-x-2 pt-2">
                          <Button 
                            className="flex-1 bg-primary-50 text-primary hover:bg-primary-100"
                            onClick={() => confirmMutation.mutate(match.id)}
                            disabled={confirmMutation.isPending}
                          >
                            {confirmMutation.isPending ? "Confirmando..." : "Confirmar"}
                          </Button>
                          <Button variant="outline" className="flex-1">
                            <Share className="h-4 w-4 mr-2" />
                            Compartilhar
                          </Button>
                        </div>
                      )}

                      {match.status === "in_progress" && (
                        <div className="bg-slate-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-slate-700">Partida em Andamento</span>
                            <span className="text-xs text-slate-500">Tempo Real</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button size="sm" variant="outline" className="flex-1">
                              Ver Estatísticas
                            </Button>
                            <Button size="sm" variant="outline" className="flex-1">
                              Acompanhar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
