import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ArrowLeft, Calendar, MapPin } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const matchSchema = z.object({
  title: z.string().min(1, "Nome da partida é obrigatório"),
  description: z.string().optional(),
  location: z.string().min(1, "Local é obrigatório"),
  date: z.string().min(1, "Data é obrigatória"),
  time: z.string().min(1, "Horário é obrigatório"),
  maxPlayers: z.number().min(4, "Mínimo de 4 jogadores").max(50, "Máximo de 50 jogadores"),
  isPublic: z.boolean().default(true),
  autoRelease: z.boolean().default(true),
});

type MatchFormData = z.infer<typeof matchSchema>;

export default function CreateMatch() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedSport, setSelectedSport] = useState("football");

  const form = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
    defaultValues: {
      title: "",
      description: "",
      location: "",
      date: "",
      time: "",
      maxPlayers: 20,
      isPublic: true,
      autoRelease: true,
    },
  });

  const createMatchMutation = useMutation({
    mutationFn: async (data: MatchFormData) => {
      const matchDate = new Date(`${data.date}T${data.time}`);
      const matchData = {
        title: data.title,
        description: data.description,
        location: data.location,
        date: matchDate.toISOString(),
        maxPlayers: data.maxPlayers,
        isPublic: data.isPublic,
        autoRelease: data.autoRelease,
      };
      return await apiRequest("POST", "/api/matches", matchData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({
        title: "Partida criada!",
        description: "Sua partida foi criada com sucesso.",
      });
      setLocation("/matches");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar partida",
        description: error.message || "Ocorreu um erro inesperado.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: MatchFormData) => {
    createMatchMutation.mutate(data);
  };

  const handleBack = () => {
    setLocation("/matches");
  };

  const sportOptions = [
    { value: "football", label: "Futebol", icon: "⚽" },
    { value: "basketball", label: "Basquete", icon: "🏀" },
    { value: "volleyball", label: "Vôlei", icon: "🏐" },
    { value: "tennis", label: "Tênis", icon: "🎾" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-4 py-4 flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleBack} className="lg:hidden">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Nova Partida</h1>
            <p className="text-sm text-slate-600">Organize uma nova partida</p>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Match Type */}
            <Card>
              <CardContent className="p-6">
                <Label className="text-sm font-medium text-slate-700 mb-3 block">Tipo de Partida</Label>
                <div className="grid grid-cols-2 gap-3">
                  {sportOptions.map((sport) => (
                    <Button
                      key={sport.value}
                      type="button"
                      variant={selectedSport === sport.value ? "default" : "outline"}
                      className={`h-16 flex flex-col items-center justify-center space-y-2 ${
                        selectedSport === sport.value
                          ? "bg-primary text-white"
                          : "bg-white border-slate-200"
                      }`}
                      onClick={() => setSelectedSport(sport.value)}
                    >
                      <span className="text-2xl">{sport.icon}</span>
                      <span className="font-medium">{sport.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Match Details */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Partida</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Racha de Quinta" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Local</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                          <Input placeholder="Ex: Campo do Vila" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                            <Input type="date" className="pl-10" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="time"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Horário</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="maxPlayers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Máximo de Jogadores</FormLabel>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o número de jogadores" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="10">10 jogadores</SelectItem>
                          <SelectItem value="14">14 jogadores</SelectItem>
                          <SelectItem value="20">20 jogadores</SelectItem>
                          <SelectItem value="22">22 jogadores</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (Opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Informações adicionais sobre a partida..."
                          rows={3}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Settings */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-slate-900">Configurações</h3>
                
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                        <FormLabel className="text-base font-medium text-slate-900">Lista Pública</FormLabel>
                        <p className="text-sm text-slate-600">Qualquer um pode se inscrever</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="autoRelease"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div>
                        <FormLabel className="text-base font-medium text-slate-900">Liberar Lista Automaticamente</FormLabel>
                        <p className="text-sm text-slate-600">24h antes da partida</p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3 pt-4">
              <Button 
                type="submit" 
                className="w-full bg-primary hover:bg-primary/90 text-white"
                disabled={createMatchMutation.isPending}
              >
                {createMatchMutation.isPending ? "Criando..." : "Criar Partida"}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                className="w-full"
                onClick={handleBack}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
