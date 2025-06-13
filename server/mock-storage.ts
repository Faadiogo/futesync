import { 
  type User, type InsertUser, type Match, type InsertMatch,
  type Confirmation, type InsertConfirmation, type Statistics, type InsertStatistics,
  type Post, type InsertPost, type Comment, type InsertComment,
  type Rating, type InsertRating, type Friendship, type InsertFriendship,
  type MatchInvitation, type InsertMatchInvitation, type MatchFinance, type InsertMatchFinance,
  type UserPayment, type InsertUserPayment, type Notification, type InsertNotification
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
  private friendships: Friendship[] = [];
  private matchInvitations: MatchInvitation[] = [];
  private matchFinances: MatchFinance[] = [];
  private userPayments: UserPayment[] = [];
  private notifications: Notification[] = [];

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
      plan: user.plan || "free",
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
    const generateCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
    const newMatch: Match = {
      id: this.generateId(),
      title: match.title,
      description: match.description || null,
      location: match.location,
      date: match.date,
      maxPlayers: match.maxPlayers || 20,
      status: match.status || "scheduled",
      isPublic: match.isPublic !== undefined ? match.isPublic : true,
      autoRelease: match.autoRelease !== undefined ? match.autoRelease : true,
      inviteCode: generateCode(),
      inviteLink: `/join/${this.generateId()}`,
      requiresApproval: match.requiresApproval || false,
      createdBy: match.createdBy,
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
      userId: confirmation.userId,
      matchId: confirmation.matchId,
      confirmed: confirmation.confirmed || false,
      attended: confirmation.attended || false,
      status: confirmation.status || "pending",
      confirmedAt: confirmation.confirmedAt || null,
      cancelledAt: confirmation.cancelledAt || null,
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

  // Friendships
  async createFriendship(friendship: InsertFriendship): Promise<Friendship> {
    const newFriendship: Friendship = {
      id: this.generateId(),
      requesterId: friendship.requesterId,
      addresseeId: friendship.addresseeId,
      status: friendship.status || "pending",
      createdAt: new Date(),
      acceptedAt: null,
    };
    this.friendships.push(newFriendship);
    return newFriendship;
  }

  async getFriendsByUser(userId: string): Promise<User[]> {
    const acceptedFriendships = this.friendships.filter(
      f => (f.requesterId === userId || f.addresseeId === userId) && f.status === "accepted"
    );
    const friendIds = acceptedFriendships.map(f => 
      f.requesterId === userId ? f.addresseeId : f.requesterId
    );
    return this.users.filter(user => friendIds.includes(user.id));
  }

  async getFriendRequests(userId: string): Promise<Friendship[]> {
    return this.friendships.filter(
      f => f.addresseeId === userId && f.status === "pending"
    );
  }

  async updateFriendship(id: string, status: string): Promise<Friendship> {
    const index = this.friendships.findIndex(f => f.id === id);
    if (index === -1) throw new Error("Friendship not found");
    
    this.friendships[index].status = status;
    if (status === "accepted") {
      this.friendships[index].acceptedAt = new Date();
    }
    return this.friendships[index];
  }

  // Match Invitations
  async createMatchInvitation(invitation: InsertMatchInvitation): Promise<MatchInvitation> {
    const newInvitation: MatchInvitation = {
      id: this.generateId(),
      matchId: invitation.matchId,
      inviterId: invitation.inviterId,
      inviteeId: invitation.inviteeId || null,
      email: invitation.email || null,
      status: invitation.status || "sent",
      createdAt: new Date(),
      respondedAt: null,
    };
    this.matchInvitations.push(newInvitation);
    return newInvitation;
  }

  async getMatchInvitations(matchId: string): Promise<MatchInvitation[]> {
    return this.matchInvitations.filter(inv => inv.matchId === matchId);
  }

  async getUserInvitations(userId: string): Promise<MatchInvitation[]> {
    return this.matchInvitations.filter(inv => inv.inviteeId === userId);
  }

  async updateMatchInvitation(id: string, status: string): Promise<MatchInvitation> {
    const index = this.matchInvitations.findIndex(inv => inv.id === id);
    if (index === -1) throw new Error("Invitation not found");
    
    this.matchInvitations[index].status = status;
    this.matchInvitations[index].respondedAt = new Date();
    return this.matchInvitations[index];
  }

  async joinMatchByCode(userId: string, code: string): Promise<Match> {
    const match = this.matches.find(m => m.inviteCode === code);
    if (!match) throw new Error("Invalid invite code");
    
    // Create confirmation for the user
    await this.createConfirmation({
      userId,
      matchId: match.id,
      confirmed: !match.requiresApproval,
      attended: false,
      status: match.requiresApproval ? "pending" : "approved",
    });
    
    return match;
  }

  // Financial Control
  async createMatchFinance(finance: InsertMatchFinance): Promise<MatchFinance> {
    const newFinance: MatchFinance = {
      id: this.generateId(),
      matchId: finance.matchId,
      type: finance.type,
      category: finance.category,
      description: finance.description,
      amount: finance.amount,
      createdBy: finance.createdBy,
      createdAt: new Date(),
    };
    this.matchFinances.push(newFinance);
    return newFinance;
  }

  async getMatchFinances(matchId: string): Promise<MatchFinance[]> {
    return this.matchFinances.filter(f => f.matchId === matchId);
  }

  async createUserPayment(payment: InsertUserPayment): Promise<UserPayment> {
    const newPayment: UserPayment = {
      id: this.generateId(),
      matchId: payment.matchId,
      userId: payment.userId,
      amount: payment.amount,
      status: payment.status || "pending",
      dueDate: payment.dueDate || null,
      paidAt: null,
      createdAt: new Date(),
    };
    this.userPayments.push(newPayment);
    return newPayment;
  }

  async getUserPayments(userId: string, matchId?: string): Promise<UserPayment[]> {
    let payments = this.userPayments.filter(p => p.userId === userId);
    if (matchId) {
      payments = payments.filter(p => p.matchId === matchId);
    }
    return payments;
  }

  async updateUserPayment(id: string, payment: Partial<InsertUserPayment>): Promise<UserPayment> {
    const index = this.userPayments.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Payment not found");
    
    this.userPayments[index] = { ...this.userPayments[index], ...payment };
    if (payment.status === "paid") {
      this.userPayments[index].paidAt = new Date();
    }
    return this.userPayments[index];
  }

  async getMatchFinancialReport(matchId: string): Promise<{
    totalRevenue: number;
    totalExpenses: number;
    balance: number;
    pendingPayments: number;
  }> {
    const finances = await this.getMatchFinances(matchId);
    const payments = this.userPayments.filter(p => p.matchId === matchId);
    
    const totalRevenue = finances
      .filter(f => f.type === "revenue")
      .reduce((sum, f) => sum + f.amount, 0);
    const totalExpenses = finances
      .filter(f => f.type === "expense")
      .reduce((sum, f) => sum + f.amount, 0);
    const pendingPayments = payments
      .filter(p => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);
    
    return {
      totalRevenue,
      totalExpenses,
      balance: totalRevenue - totalExpenses,
      pendingPayments,
    };
  }

  // Notifications
  async createNotification(notification: InsertNotification): Promise<Notification> {
    const newNotification: Notification = {
      id: this.generateId(),
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedId: notification.relatedId || null,
      read: notification.read || false,
      createdAt: new Date(),
    };
    this.notifications.push(newNotification);
    return newNotification;
  }

  async getUserNotifications(userId: string): Promise<Notification[]> {
    return this.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async markNotificationRead(id: string): Promise<Notification> {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index === -1) throw new Error("Notification not found");
    
    this.notifications[index].read = true;
    return this.notifications[index];
  }

  // Plan Limits
  async checkUserPlanLimits(userId: string): Promise<{
    canCreateMatch: boolean;
    canJoinMatch: boolean;
    createdMatches: number;
    joinedMatches: number;
    maxCreatedMatches: number;
    maxJoinedMatches: number;
  }> {
    const user = await this.getUserById(userId);
    if (!user) throw new Error("User not found");
    
    const planLimits = {
      free: { maxCreated: 0, maxJoined: 1 },
      basic: { maxCreated: 2, maxJoined: 4 },
      intermediate: { maxCreated: 5, maxJoined: 10 },
      advanced: { maxCreated: 10, maxJoined: 20 },
    };
    
    const limits = planLimits[user.plan as keyof typeof planLimits] || planLimits.free;
    const createdMatches = this.matches.filter(m => m.createdBy === userId).length;
    const joinedMatches = this.confirmations.filter(c => c.userId === userId).length;
    
    return {
      canCreateMatch: createdMatches < limits.maxCreated,
      canJoinMatch: joinedMatches < limits.maxJoined,
      createdMatches,
      joinedMatches,
      maxCreatedMatches: limits.maxCreated,
      maxJoinedMatches: limits.maxJoined,
    };
  }
}