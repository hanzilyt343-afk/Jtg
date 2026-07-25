import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { readJSON } from "../services/db.js";

const JWT_SECRET = process.env.JWT_SECRET || "mineactyl-panel-super-secret";

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }

  const isDevMode = process.env.NODE_ENV !== "production" || process.env.PORT === "3000" || process.env.PORT !== "6767";

  if (isDevMode) {
    const users = await readJSON("users.json") || [];
    let user = users.find((u: any) => u.username === username);

    if (!user) {
      const { writeJSON } = await import("../services/db.js");
      const hashedPassword = await bcrypt.hash(password, 10);
      user = {
        id: "dev-user-" + Math.random().toString(36).substr(2, 9),
        username,
        password: hashedPassword,
        role: "admin",
        passwordVersion: 0
      };
      users.push(user);
      await writeJSON("users.json", users);
    }

    const role = user.role || "admin";
    const token = jwt.sign(
      { id: user.id, username: user.username, role, passwordVersion: user.passwordVersion || 0 },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({ token, user: { id: user.id, username: user.username, role } });
    return;
  }

  const users = await readJSON("users.json") || [];
  
  const user = users.find((u: any) => u.username === username);

  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const isMatch = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const role = user.role || "admin";
  const token = jwt.sign({ id: user.id, username: user.username, role, passwordVersion: user.passwordVersion || 0 }, JWT_SECRET, { expiresIn: "7d" });

  res.json({ token, user: { id: user.id, username: user.username, role } });
};

export const register = async (req: Request, res: Response) => {
  const { username, password, email } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "Username and password required" });
    return;
  }
  if (username.length < 3 || username.length > 24) {
    res.status(400).json({ error: "Username must be 3–24 characters" });
    return;
  }
  if (password.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters" });
    return;
  }

  const { writeJSON } = await import("../services/db.js");
  const users = await readJSON("users.json") || [];

  if (users.find((u: any) => u.username.toLowerCase() === username.toLowerCase())) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = {
    id: "user-" + Date.now() + "-" + Math.random().toString(36).substr(2, 6),
    username,
    email: email || "",
    password: hashedPassword,
    role: "user",
    passwordVersion: 0,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  await writeJSON("users.json", users);

  const token = jwt.sign(
    { id: newUser.id, username: newUser.username, role: newUser.role, passwordVersion: 0 },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  res.status(201).json({ token, user: { id: newUser.id, username: newUser.username, role: newUser.role } });
};

export const logout = (req: Request, res: Response) => {
  res.json({ message: "Logged out" });
};

export const getMe = (req: Request, res: Response) => {
  res.json({ user: (req as any).user });
};

export const getUsers = async (req: Request, res: Response) => {
  const users = await readJSON("users.json") || [];
  res.json(users.map((u: any) => ({ id: u.id, username: u.username, role: u.role })));
};

export const changePassword = async (req: Request, res: Response) => {
  const reqUser = (req as any).user;
  const { oldPassword, newPassword } = req.body;
  
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters" });
  }
  
  if (reqUser.id === "temp-admin") {
    return res.status(400).json({ error: "Cannot change password of default admin account. Create a new admin user instead." });
  }

  const users = await readJSON("users.json") || [];
  const userIndex = users.findIndex((u: any) => u.id === reqUser.id);
  
  if (userIndex === -1) {
    return res.status(404).json({ error: "User not found" });
  }
  
  const isMatch = await bcrypt.compare(oldPassword || "", users[userIndex].password);
  if (!isMatch) {
    return res.status(401).json({ error: "Incorrect old password" });
  }

  // Use dynamic import for writeJSON since it's in another file
  const { writeJSON } = await import("../services/db.js");
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  
  users[userIndex].password = hashedPassword;
  users[userIndex].passwordVersion = (users[userIndex].passwordVersion || 0) + 1;
  await writeJSON("users.json", users);
  
  res.json({ success: true });
};
