import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import { eq, desc, and, sql, count } from "drizzle-orm";
import { 
  users, matches, confirmations, statistics, posts, comments, ratings,
  type User, type InsertUser, type Match, type InsertMatch,
  type Confirmation, type InsertConfirmation, type Statistics, type InsertStatistics,
  type Post, type InsertPost, type Comment, type InsertComment,
  type Rating, type InsertRating
} from "@shared/schema";

let db: any;
let dbInitialized = false;

try {
  const client = neon(process.env.DATABASE_URL!);
  db = drizzle(client);
  dbInitialized = true;
} catch (error) {
  console.warn("Database connection failed, will retry on first request");
}

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User>;
  
  // Matches
  createMatch(match: InsertMatch): Promise<Match>;
  getMatches(): Promise<Match[]>;
  getMatchById(id: string): Promise<Match | undefined>;
  getMatchesByUser(userId: string): Promise<Match[]>;
  updateMatch(id: string, match: Partial<InsertMatch>): Promise<Match>;
  deleteMatch(id: string): Promise<void>;
  
  // Confirmations
  createConfirmation(confirmation: InsertConfirmation): Promise<Confirmation>;
  getConfirmationsByMatch(matchId: string): Promise<Confirmation[]>;
  getConfirmationsByUser(userId: string): Promise<Confirmation[]>;
  updateConfirmation(userId: string, matchId: string, confirmed: boolean): Promise<Confirmation>;
  
  // Statistics
  createStatistics(stats: InsertStatistics): Promise<Statistics>;
  getStatisticsByMatch(matchId: string): Promise<Statistics[]>;
  getStatisticsByUser(userId: string): Promise<Statistics[]>;
  updateStatistics(id: string, stats: Partial<InsertStatistics>): Promise<Statistics>;
  
  // Posts
  createPost(post: InsertPost): Promise<Post>;
  getPosts(): Promise<Post[]>;
  getPostsByMatch(matchId: string): Promise<Post[]>;
  updatePost(id: string, post: Partial<InsertPost>): Promise<Post>;
  deletePost(id: string): Promise<void>;
  toggleLike(postId: string, userId: string): Promise<Post>;
  
  // Comments
  createComment(comment: InsertComment): Promise<Comment>;
  getCommentsByPost(postId: string): Promise<Comment[]>;
  
  // Ratings
  createRating(rating: InsertRating): Promise<Rating>;
  getRatingsByPlayer(playerId: string): Promise<Rating[]>;
  getRatingsByMatch(matchId: string): Promise<Rating[]>;
  
  // Analytics
  getUserStats(userId: string): Promise<{
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
    averageRating: number;
    attendanceRate: number;
  }>;
}

export class DbStorage implements IStorage {
  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async updateUser(id: string, user: Partial<InsertUser>): Promise<User> {
    const result = await db.update(users).set(user).where(eq(users.id, id)).returning();
    return result[0];
  }

  async createMatch(match: InsertMatch): Promise<Match> {
    const result = await db.insert(matches).values(match).returning();
    return result[0];
  }

  async getMatches(): Promise<Match[]> {
    return await db.select().from(matches).orderBy(desc(matches.date));
  }

  async getMatchById(id: string): Promise<Match | undefined> {
    const result = await db.select().from(matches).where(eq(matches.id, id));
    return result[0];
  }

  async getMatchesByUser(userId: string): Promise<Match[]> {
    return await db.select().from(matches).where(eq(matches.createdBy, userId)).orderBy(desc(matches.date));
  }

  async updateMatch(id: string, match: Partial<InsertMatch>): Promise<Match> {
    const result = await db.update(matches).set(match).where(eq(matches.id, id)).returning();
    return result[0];
  }

  async deleteMatch(id: string): Promise<void> {
    await db.delete(matches).where(eq(matches.id, id));
  }

  async createConfirmation(confirmation: InsertConfirmation): Promise<Confirmation> {
    const result = await db.insert(confirmations).values(confirmation).returning();
    return result[0];
  }

  async getConfirmationsByMatch(matchId: string): Promise<Confirmation[]> {
    return await db.select().from(confirmations).where(eq(confirmations.matchId, matchId));
  }

  async getConfirmationsByUser(userId: string): Promise<Confirmation[]> {
    return await db.select().from(confirmations).where(eq(confirmations.userId, userId));
  }

  async updateConfirmation(userId: string, matchId: string, confirmed: boolean): Promise<Confirmation> {
    const result = await db.update(confirmations)
      .set({ 
        confirmed, 
        confirmedAt: confirmed ? new Date() : null,
        cancelledAt: !confirmed ? new Date() : null
      })
      .where(and(eq(confirmations.userId, userId), eq(confirmations.matchId, matchId)))
      .returning();
    return result[0];
  }

  async createStatistics(stats: InsertStatistics): Promise<Statistics> {
    const result = await db.insert(statistics).values(stats).returning();
    return result[0];
  }

  async getStatisticsByMatch(matchId: string): Promise<Statistics[]> {
    return await db.select().from(statistics).where(eq(statistics.matchId, matchId));
  }

  async getStatisticsByUser(userId: string): Promise<Statistics[]> {
    return await db.select().from(statistics).where(eq(statistics.userId, userId));
  }

  async updateStatistics(id: string, stats: Partial<InsertStatistics>): Promise<Statistics> {
    const result = await db.update(statistics).set(stats).where(eq(statistics.id, id)).returning();
    return result[0];
  }

  async createPost(post: InsertPost): Promise<Post> {
    const result = await db.insert(posts).values(post).returning();
    return result[0];
  }

  async getPosts(): Promise<Post[]> {
    return await db.select().from(posts).orderBy(desc(posts.createdAt));
  }

  async getPostsByMatch(matchId: string): Promise<Post[]> {
    return await db.select().from(posts).where(eq(posts.matchId, matchId)).orderBy(desc(posts.createdAt));
  }

  async updatePost(id: string, post: Partial<InsertPost>): Promise<Post> {
    const result = await db.update(posts).set(post).where(eq(posts.id, id)).returning();
    return result[0];
  }

  async deletePost(id: string): Promise<void> {
    await db.delete(posts).where(eq(posts.id, id));
  }

  async toggleLike(postId: string, userId: string): Promise<Post> {
    const post = await db.select().from(posts).where(eq(posts.id, postId));
    if (!post[0]) throw new Error('Post not found');
    
    const currentLikes = post[0].likes || [];
    const hasLiked = currentLikes.includes(userId);
    
    const newLikes = hasLiked 
      ? currentLikes.filter(id => id !== userId)
      : [...currentLikes, userId];
    
    const result = await db.update(posts)
      .set({ likes: newLikes })
      .where(eq(posts.id, postId))
      .returning();
    
    return result[0];
  }

  async createComment(comment: InsertComment): Promise<Comment> {
    const result = await db.insert(comments).values(comment).returning();
    return result[0];
  }

  async getCommentsByPost(postId: string): Promise<Comment[]> {
    return await db.select().from(comments).where(eq(comments.postId, postId)).orderBy(desc(comments.createdAt));
  }

  async createRating(rating: InsertRating): Promise<Rating> {
    const result = await db.insert(ratings).values(rating).returning();
    return result[0];
  }

  async getRatingsByPlayer(playerId: string): Promise<Rating[]> {
    return await db.select().from(ratings).where(eq(ratings.playerId, playerId));
  }

  async getRatingsByMatch(matchId: string): Promise<Rating[]> {
    return await db.select().from(ratings).where(eq(ratings.matchId, matchId));
  }

  async getUserStats(userId: string): Promise<{
    totalMatches: number;
    totalGoals: number;
    totalAssists: number;
    averageRating: number;
    attendanceRate: number;
  }> {
    const [matchesCount] = await db
      .select({ count: count() })
      .from(confirmations)
      .where(eq(confirmations.userId, userId));

    const [attendedCount] = await db
      .select({ count: count() })
      .from(confirmations)
      .where(and(eq(confirmations.userId, userId), eq(confirmations.attended, true)));

    const [statsResult] = await db
      .select({
        totalGoals: sql<number>`sum(${statistics.goals})`,
        totalAssists: sql<number>`sum(${statistics.assists})`,
      })
      .from(statistics)
      .where(eq(statistics.userId, userId));

    const [ratingsResult] = await db
      .select({
        averageRating: sql<number>`avg(${ratings.rating})`,
      })
      .from(ratings)
      .where(eq(ratings.playerId, userId));

    return {
      totalMatches: matchesCount.count,
      totalGoals: statsResult.totalGoals || 0,
      totalAssists: statsResult.totalAssists || 0,
      averageRating: ratingsResult.averageRating || 0,
      attendanceRate: matchesCount.count > 0 ? (attendedCount.count / matchesCount.count) * 100 : 0,
    };
  }
}

import { MockStorage } from "./mock-storage";

// Use mock storage if database connection fails
let storage: IStorage;

async function initializeStorage(): Promise<IStorage> {
  if (!dbInitialized) {
    console.log("Using mock storage due to database connection issues");
    return new MockStorage();
  }
  
  try {
    // Test database connection
    await db.select().from(users).limit(1);
    return new DbStorage();
  } catch (error) {
    console.warn("Database connection test failed, falling back to mock storage:", error);
    return new MockStorage();
  }
}

// Initialize storage on first access
let storagePromise: Promise<IStorage> | null = null;

function getStorage(): Promise<IStorage> {
  if (!storagePromise) {
    storagePromise = initializeStorage();
  }
  return storagePromise;
}

export { getStorage };
