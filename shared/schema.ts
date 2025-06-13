import { pgTable, text, uuid, timestamp, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  photoUrl: text("photo_url"),
  role: text("role").notNull().default("player"), // player, moderator, admin
  position: text("position"), // player position (e.g. midfielder, forward)
  plan: text("plan").notNull().default("free"), // free, basic, intermediate, advanced
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location").notNull(),
  date: timestamp("date").notNull(),
  maxPlayers: integer("max_players").notNull().default(20),
  status: text("status").notNull().default("scheduled"), // scheduled, in_progress, finished
  isPublic: boolean("is_public").notNull().default(true),
  autoRelease: boolean("auto_release").notNull().default(true),
  inviteCode: text("invite_code").unique(),
  inviteLink: text("invite_link").unique(),
  requiresApproval: boolean("requires_approval").notNull().default(false),
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const confirmations = pgTable("confirmations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  matchId: uuid("match_id").references(() => matches.id).notNull(),
  confirmed: boolean("confirmed").notNull().default(false),
  attended: boolean("attended").notNull().default(false),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  confirmedAt: timestamp("confirmed_at"),
  cancelledAt: timestamp("cancelled_at"),
});

export const statistics = pgTable("statistics", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id").references(() => matches.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  goals: integer("goals").notNull().default(0),
  assists: integer("assists").notNull().default(0),
  yellowCards: integer("yellow_cards").notNull().default(0),
  redCards: integer("red_cards").notNull().default(0),
  approvedBy: text("approved_by").array(),
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id").references(() => matches.id),
  userId: uuid("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  imageUrl: text("image_url"),
  likes: text("likes").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").references(() => posts.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const ratings = pgTable("ratings", {
  id: uuid("id").primaryKey().defaultRandom(),
  raterId: uuid("rater_id").references(() => users.id).notNull(),
  playerId: uuid("player_id").references(() => users.id).notNull(),
  matchId: uuid("match_id").references(() => matches.id).notNull(),
  rating: integer("rating").notNull(), // 1-10
  comment: text("comment"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const friendships = pgTable("friendships", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: uuid("requester_id").references(() => users.id).notNull(),
  addresseeId: uuid("addressee_id").references(() => users.id).notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  acceptedAt: timestamp("accepted_at"),
});

export const matchInvitations = pgTable("match_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id").references(() => matches.id).notNull(),
  inviterId: uuid("inviter_id").references(() => users.id).notNull(),
  inviteeId: uuid("invitee_id").references(() => users.id),
  email: text("email"), // for inviting non-users
  status: text("status").notNull().default("sent"), // sent, accepted, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
  respondedAt: timestamp("responded_at"),
});

export const matchFinances = pgTable("match_finances", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id").references(() => matches.id).notNull(),
  type: text("type").notNull(), // expense, revenue
  category: text("category").notNull(), // rent, referee, goalkeeper, barbecue, uniforms, ball, monthly_fee, casual_payment
  description: text("description").notNull(),
  amount: integer("amount").notNull(), // in cents
  createdBy: uuid("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const userPayments = pgTable("user_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  matchId: uuid("match_id").references(() => matches.id).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // in cents
  status: text("status").notNull().default("pending"), // pending, paid, overdue
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: text("type").notNull(), // match_invitation, friend_request, payment_due, match_approved
  title: text("title").notNull(),
  message: text("message").notNull(),
  relatedId: uuid("related_id"), // matchId, friendshipId, etc.
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
}).extend({
  photoUrl: z.string().optional(),
  position: z.string().optional(),
  role: z.string().optional().default("player"),
  plan: z.string().optional().default("free"),
});

export const insertMatchSchema = createInsertSchema(matches).omit({
  id: true,
  createdAt: true,
});

export const insertConfirmationSchema = createInsertSchema(confirmations).omit({
  id: true,
});

export const insertStatisticsSchema = createInsertSchema(statistics).omit({
  id: true,
  createdAt: true,
});

export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  likes: true,
});

export const insertCommentSchema = createInsertSchema(comments).omit({
  id: true,
  createdAt: true,
});

export const insertRatingSchema = createInsertSchema(ratings).omit({
  id: true,
  createdAt: true,
});

export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
});

export const insertMatchInvitationSchema = createInsertSchema(matchInvitations).omit({
  id: true,
  createdAt: true,
});

export const insertMatchFinanceSchema = createInsertSchema(matchFinances).omit({
  id: true,
  createdAt: true,
});

export const insertUserPaymentSchema = createInsertSchema(userPayments).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Match = typeof matches.$inferSelect;
export type InsertMatch = z.infer<typeof insertMatchSchema>;
export type Confirmation = typeof confirmations.$inferSelect;
export type InsertConfirmation = z.infer<typeof insertConfirmationSchema>;
export type Statistics = typeof statistics.$inferSelect;
export type InsertStatistics = z.infer<typeof insertStatisticsSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Rating = typeof ratings.$inferSelect;
export type InsertRating = z.infer<typeof insertRatingSchema>;
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type MatchInvitation = typeof matchInvitations.$inferSelect;
export type InsertMatchInvitation = z.infer<typeof insertMatchInvitationSchema>;
export type MatchFinance = typeof matchFinances.$inferSelect;
export type InsertMatchFinance = z.infer<typeof insertMatchFinanceSchema>;
export type UserPayment = typeof userPayments.$inferSelect;
export type InsertUserPayment = z.infer<typeof insertUserPaymentSchema>;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
