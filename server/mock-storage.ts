import { 
  type User, type InsertUser, type Match, type InsertMatch,
  type Confirmation, type InsertConfirmation, type Statistics, type InsertStatistics,
  type Post, type InsertPost, type Comment, type InsertComment,
  type Rating, type InsertRating
} from "@shared/schema";
import { IStorage } from "./storage";

export class MockStorage implements IStorage {
  private users: User[] = [];
  private matches: Match[] = [];
  private confirmations: Confirmation[] = [];
  private statistics: Statistics[] = [];
  private posts: Post[] = [];
  private comments: Comment[] = [];
  private ratings: Rating[] = [];

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = {
      id: this.generateId(),
      name: user.name,
      email: user.email,
      password: user.password,
      photoUrl: user.photoUrl || null,
      role: user.role || "player",
      position: user.position || null,
      createdAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.find(user => user.id === id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return this.users.find(user => user.email === email);
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User> {
    const index = this.users.findIndex(user => user.id === id);
    if (index === -1) throw new Error("User not found");
    
    this.users[index] = { ...this.users[index], ...userData };
    return this.users[index];
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const newMatch: Match = {
      id: this.generateId(),
      ...match,
      createdAt: new Date(),
    };
    this.matches.push(newMatch);
    return newMatch;
  }

  async getMatches(): Promise<Match[]> {
    return [...this.matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getMatchById(id: string): Promise<Match | undefined> {
    return this.matches.find(match => match.id === id);
  }

  async getMatchesByUser(userId: string): Promise<Match[]> {
    return this.matches.filter(match => match.createdBy === userId);
  }

  async updateMatch(id: string, matchData: Partial<InsertMatch>): Promise<Match> {
    const index = this.matches.findIndex(match => match.id === id);
    if (index === -1) throw new Error("Match not found");
    
    this.matches[index] = { ...this.matches[index], ...matchData };
    return this.matches[index];
  }

  async deleteMatch(id: string): Promise<void> {
    const index = this.matches.findIndex(match => match.id === id);
    if (index !== -1) {
      this.matches.splice(index, 1);
    }
  }

  async createConfirmation(confirmation: InsertConfirmation): Promise<Confirmation> {
    const newConfirmation: Confirmation = {
      id: this.generateId(),
      ...confirmation,
    };
    this.confirmations.push(newConfirmation);
    return newConfirmation;
  }

  async getConfirmationsByMatch(matchId: string): Promise<Confirmation[]> {
    return this.confirmations.filter(conf => conf.matchId === matchId);
  }

  async getConfirmationsByUser(userId: string): Promise<Confirmation[]> {
    return this.confirmations.filter(conf => conf.userId === userId);
  }

  async updateConfirmation(userId: string, matchId: string, confirmed: boolean): Promise<Confirmation> {
    let confirmation = this.confirmations.find(conf => conf.userId === userId && conf.matchId === matchId);
    
    if (!confirmation) {
      confirmation = {
        id: this.generateId(),
        userId,
        matchId,
        confirmed,
        attended: false,
        confirmedAt: confirmed ? new Date() : null,
        cancelledAt: !confirmed ? new Date() : null,
      };
      this.confirmations.push(confirmation);
    } else {
      confirmation.confirmed = confirmed;
      confirmation.confirmedAt = confirmed ? new Date() : null;
      confirmation.cancelledAt = !confirmed ? new Date() : null;
    }
    
    return confirmation;
  }

  async createStatistics(stats: InsertStatistics): Promise<Statistics> {
    const newStats: Statistics = {
      id: this.generateId(),
      ...stats,
      createdAt: new Date(),
    };
    this.statistics.push(newStats);
    return newStats;
  }

  async getStatisticsByMatch(matchId: string): Promise<Statistics[]> {
    return this.statistics.filter(stats => stats.matchId === matchId);
  }

  async getStatisticsByUser(userId: string): Promise<Statistics[]> {
    return this.statistics.filter(stats => stats.userId === userId);
  }

  async updateStatistics(id: string, statsData: Partial<InsertStatistics>): Promise<Statistics> {
    const index = this.statistics.findIndex(stats => stats.id === id);
    if (index === -1) throw new Error("Statistics not found");
    
    this.statistics[index] = { ...this.statistics[index], ...statsData };
    return this.statistics[index];
  }

  async createPost(post: InsertPost): Promise<Post> {
    const newPost: Post = {
      id: this.generateId(),
      ...post,
      likes: [],
      createdAt: new Date(),
    };
    this.posts.push(newPost);
    return newPost;
  }

  async getPosts(): Promise<Post[]> {
    return [...this.posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async getPostsByMatch(matchId: string): Promise<Post[]> {
    return this.posts.filter(post => post.matchId === matchId);
  }

  async updatePost(id: string, postData: Partial<InsertPost>): Promise<Post> {
    const index = this.posts.findIndex(post => post.id === id);
    if (index === -1) throw new Error("Post not found");
    
    this.posts[index] = { ...this.posts[index], ...postData };
    return this.posts[index];
  }

  async deletePost(id: string): Promise<void> {
    const index = this.posts.findIndex(post => post.id === id);
    if (index !== -1) {
      this.posts.splice(index, 1);
    }
  }

  async toggleLike(postId: string, userId: string): Promise<Post> {
    const post = this.posts.find(p => p.id === postId);
    if (!post) throw new Error('Post not found');
    
    const hasLiked = post.likes.includes(userId);
    
    if (hasLiked) {
      post.likes = post.likes.filter(id => id !== userId);
    } else {
      post.likes.push(userId);
    }
    
    return post;
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const newComment: Comment = {
      id: this.generateId(),
      ...comment,
      createdAt: new Date(),
    };
    this.comments.push(newComment);
    return newComment;
  }

  async getCommentsByPost(postId: string): Promise<Comment[]> {
    return this.comments.filter(comment => comment.postId === postId);
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const newRating: Rating = {
      id: this.generateId(),
      ...rating,
      createdAt: new Date(),
    };
    this.ratings.push(newRating);
    return newRating;
  }

  async getRatingsByPlayer(playerId: string): Promise<Rating[]> {
    return this.ratings.filter(rating => rating.playerId === playerId);
  }

  async getRatingsByMatch(matchId: string): Promise<Rating[]> {
    return this.ratings.filter(rating => rating.matchId === matchId);
  }

  async getUserStats(userId: string): Promise<{
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
    averageRating: number;
    attendanceRate: number;
  }> {
    const userConfirmations = this.confirmations.filter(conf => conf.userId === userId);
    const userStats = this.statistics.filter(stats => stats.userId === userId);
    const userRatings = this.ratings.filter(rating => rating.playerId === userId);
    
    const totalMatches = userConfirmations.length;
    const attendedMatches = userConfirmations.filter(conf => conf.attended).length;
    const totalGoals = userStats.reduce((sum, stats) => sum + stats.goals, 0);
    const totalAssists = userStats.reduce((sum, stats) => sum + stats.assists, 0);
    const averageRating = userRatings.length > 0 
      ? userRatings.reduce((sum, rating) => sum + rating.rating, 0) / userRatings.length 
      : 0;
    const attendanceRate = totalMatches > 0 ? (attendedMatches / totalMatches) * 100 : 0;

    return {
      totalMatches,
      totalGoals,
      totalAssists,
      averageRating,
      attendanceRate,
    };
  }
}