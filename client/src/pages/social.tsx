import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Heart, MessageCircle, Share, Image, Video, MoreHorizontal, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface Post {
  id: string;
  userId: string;
  content: string;
  imageUrl?: string;
  likes: string[];
  createdAt: string;
  matchId?: string;
}

interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
}

const postSchema = z.object({
  content: z.string().min(1, "O post não pode estar vazio").max(500, "Máximo de 500 caracteres"),
});

type PostFormData = z.infer<typeof postSchema>;

export default function Social() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["/api/posts"],
  });

  const form = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      content: "",
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (data: PostFormData) => {
      return await apiRequest("POST", "/api/posts", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
      form.reset();
      toast({
        title: "Post publicado!",
        description: "Seu post foi publicado com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível publicar o post.",
        variant: "destructive",
      });
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      return await apiRequest("POST", `/api/posts/${postId}/like`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/posts"] });
    },
  });

  const onSubmit = (data: PostFormData) => {
    createPostMutation.mutate(data);
  };

  const toggleLike = (postId: string) => {
    likeMutation.mutate(postId);
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Agora";
    if (diffInHours < 24) return `${diffInHours}h atrás`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="px-4 py-4">
          <h1 className="text-2xl font-bold text-slate-900">Rede Social</h1>
          <p className="text-sm text-slate-600">Interaja com a comunidade</p>
        </div>
      </header>

      <div className="p-4 space-y-6">
        {/* Create Post */}
        <Card>
          <CardContent className="p-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={user?.photoUrl} />
                    <AvatarFallback className="bg-primary text-white">
                      {user?.name ? getUserInitials(user.name) : <Users className="h-5 w-5" />}
                    </AvatarFallback>
                  </Avatar>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormControl>
                          <Input
                            placeholder="Compartilhe algo com a galera..."
                            className="bg-slate-50 border-slate-200"
                            {...field}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex space-x-4">
                    <Button type="button" variant="ghost" size="sm" className="text-slate-600">
                      <Image className="h-4 w-4 mr-2" />
                      Foto
                    </Button>
                    <Button type="button" variant="ghost" size="sm" className="text-slate-600">
                      <Video className="h-4 w-4 mr-2" />
                      Vídeo
                    </Button>
                  </div>
                  <Button 
                    type="submit" 
                    className="bg-primary hover:bg-primary/90"
                    disabled={createPostMutation.isPending}
                  >
                    {createPostMutation.isPending ? "Publicando..." : "Publicar"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Posts Feed */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-slate-200 rounded w-32"></div>
                        <div className="h-3 bg-slate-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="h-16 bg-slate-200 rounded mb-4"></div>
                    <div className="flex space-x-4">
                      <div className="h-8 bg-slate-200 rounded w-16"></div>
                      <div className="h-8 bg-slate-200 rounded w-16"></div>
                      <div className="h-8 bg-slate-200 rounded w-16"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : posts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">Nenhum post ainda</p>
                <p className="text-sm text-slate-500">Seja o primeiro a compartilhar algo com a comunidade!</p>
              </CardContent>
            </Card>
          ) : (
            posts.map((post) => {
              const hasLiked = post.likes.includes(user?.id || '');
              const likesCount = post.likes.length;
              
              return (
                <Card key={post.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-12 h-12">
                          <AvatarImage src="" />
                          <AvatarFallback className="bg-blue-500 text-white">
                            {getUserInitials("Usuário")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-slate-900">Usuário</p>
                          <p className="text-sm text-slate-600">{formatDate(post.createdAt)}</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-slate-900 mb-4">{post.content}</p>

                    {post.imageUrl && (
                      <img 
                        src={post.imageUrl} 
                        alt="Post" 
                        className="w-full h-48 object-cover rounded-lg mb-4" 
                      />
                    )}

                    {/* Post Stats */}
                    <div className="flex items-center justify-between py-2 border-t border-slate-100">
                      <div className="flex items-center space-x-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleLike(post.id)}
                          className={`flex items-center space-x-2 ${
                            hasLiked ? "text-red-500" : "text-slate-600"
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${hasLiked ? "fill-current" : ""}`} />
                          <span className="text-sm">{likesCount}</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center space-x-2 text-slate-600"
                        >
                          <MessageCircle className="h-4 w-4" />
                          <span className="text-sm">0</span>
                        </Button>
                        <Button variant="ghost" size="sm" className="flex items-center space-x-2 text-slate-600">
                          <Share className="h-4 w-4" />
                          <span className="text-sm">Compartilhar</span>
                        </Button>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {expandedComments.has(post.id) && (
                      <div className="mt-4 pt-4 border-t border-slate-100">
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user?.photoUrl} />
                            <AvatarFallback className="bg-primary text-white text-xs">
                              {user?.name ? getUserInitials(user.name) : <Users className="h-3 w-3" />}
                            </AvatarFallback>
                          </Avatar>
                          <Input
                            placeholder="Escreva um comentário..."
                            className="flex-1 bg-slate-50 border-slate-200"
                          />
                          <Button size="sm" className="bg-primary hover:bg-primary/90">
                            Enviar
                          </Button>
                        </div>
                      </div>
                    )}
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
