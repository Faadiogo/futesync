import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { storage } from "./storage";
import { insertUserSchema, insertMatchSchema, insertPostSchema, insertCommentSchema, insertRatingSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

interface AuthenticatedRequest extends Express.Request {
  user?: { id: string; email: string; role: string };
}

// JWT middleware
const authenticate = async (req: AuthenticatedRequest, res: Express.Response, next: Express.NextFunction) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; email: string; role: string };
    const user = await storage.getUserById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = { id: user.id, email: user.email, role: user.role };
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};

// Role-based access control
const requireRole = (roles: string[]) => (req: AuthenticatedRequest, res: Express.Response, next: Express.NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const clients = new Map<string, WebSocket>();
  
  wss.on('connection', (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        clients.set(decoded.id, ws);
        
        ws.on('close', () => {
          clients.delete(decoded.id);
        });
      } catch (error) {
        ws.close();
      }
    } else {
      ws.close();
    }
  });

  // Broadcast to all connected clients
  const broadcast = (message: any) => {
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
      }
    });
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({ user: { id: user.id, name: user.name, email: user.email, role: user.role }, token });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/auth/me", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ id: user.id, name: user.name, email: user.email, role: user.role, position: user.position, photoUrl: user.photoUrl });
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Match routes
  app.get("/api/matches", authenticate, async (req, res) => {
    try {
      const matches = await storage.getMatches();
      res.json(matches);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/matches", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const matchData = insertMatchSchema.parse({
        ...req.body,
        createdBy: req.user!.id,
      });
      
      const match = await storage.createMatch(matchData);
      
      // Broadcast new match to all users
      broadcast({
        type: 'NEW_MATCH',
        data: match,
      });
      
      res.json(match);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.get("/api/matches/:id", authenticate, async (req, res) => {
    try {
      const match = await storage.getMatchById(req.params.id);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      res.json(match);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/matches/:id", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const match = await storage.getMatchById(req.params.id);
      if (!match) {
        return res.status(404).json({ message: "Match not found" });
      }
      
      // Check if user is creator or admin
      if (match.createdBy !== req.user!.id && req.user!.role !== 'admin') {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedMatch = await storage.updateMatch(req.params.id, req.body);
      
      broadcast({
        type: 'MATCH_UPDATED',
        data: updatedMatch,
      });
      
      res.json(updatedMatch);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Confirmation routes
  app.post("/api/matches/:id/confirm", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const confirmation = await storage.updateConfirmation(req.user!.id, req.params.id, true);
      res.json(confirmation);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.delete("/api/matches/:id/confirm", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const confirmation = await storage.updateConfirmation(req.user!.id, req.params.id, false);
      res.json(confirmation);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/matches/:id/confirmations", authenticate, async (req, res) => {
    try {
      const confirmations = await storage.getConfirmationsByMatch(req.params.id);
      res.json(confirmations);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Post routes
  app.get("/api/posts", authenticate, async (req, res) => {
    try {
      const posts = await storage.getPosts();
      res.json(posts);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/posts", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const postData = insertPostSchema.parse({
        ...req.body,
        userId: req.user!.id,
      });
      
      const post = await storage.createPost(postData);
      
      broadcast({
        type: 'NEW_POST',
        data: post,
      });
      
      res.json(post);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.post("/api/posts/:id/like", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const post = await storage.toggleLike(req.params.id, req.user!.id);
      res.json(post);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // Comment routes
  app.get("/api/posts/:id/comments", authenticate, async (req, res) => {
    try {
      const comments = await storage.getCommentsByPost(req.params.id);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/posts/:id/comments", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const commentData = insertCommentSchema.parse({
        ...req.body,
        postId: req.params.id,
        userId: req.user!.id,
      });
      
      const comment = await storage.createComment(commentData);
      res.json(comment);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Statistics routes
  app.get("/api/users/:id/stats", authenticate, async (req, res) => {
    try {
      const stats = await storage.getUserStats(req.params.id);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/matches/:id/statistics", authenticate, requireRole(['moderator', 'admin']), async (req: AuthenticatedRequest, res) => {
    try {
      const statsData = {
        ...req.body,
        matchId: req.params.id,
      };
      
      const stats = await storage.createStatistics(statsData);
      res.json(stats);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Rating routes
  app.post("/api/users/:id/rate", authenticate, async (req: AuthenticatedRequest, res) => {
    try {
      const ratingData = insertRatingSchema.parse({
        ...req.body,
        raterId: req.user!.id,
        playerId: req.params.id,
      });
      
      const rating = await storage.createRating(ratingData);
      res.json(rating);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  return httpServer;
}
