import { connectDB } from "@/lib/db";
import User, { IUser } from "@/models/User";
import mongoose from "mongoose";

function generateUsername(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 7);
  const clean = prefix.replace(/[^a-z0-9]/g, "").slice(0, 12) || "user";
  return `${clean}_${rand}`;
}

export async function findOrCreateUserByWallet(
  walletAddress: string
): Promise<IUser> {
  await connectDB();
  const addr = walletAddress.toLowerCase();

  let user = await User.findOne({ walletAddress: addr });
  if (!user) {
    const username = generateUsername("user" + addr.slice(2, 6));
    user = await User.create({
      walletAddress: addr,
      username,
      authProvider: "wallet",
    });
  }
  return user;
}

export async function findOrCreateUserByEmail(
  email: string,
  name?: string,
  image?: string
): Promise<IUser> {
  await connectDB();
  const lowerEmail = email.toLowerCase();

  let user = await User.findOne({ email: lowerEmail });
  if (!user) {
    const base = (name ?? lowerEmail.split("@")[0]).replace(/[^a-z0-9]/gi, "");
    const username = generateUsername(base || "user");
    user = await User.create({
      email: lowerEmail,
      username,
      avatarUrl: image ?? "",
      authProvider: "google",
    });
  }
  return user;
}

export async function linkGoogleToUser(
  userId: string,
  email: string,
  avatarUrl?: string
): Promise<IUser | null> {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;
  const lowerEmail = email.toLowerCase();
  // Make sure this email isn't already taken by a different user
  const conflict = await User.findOne({
    email: lowerEmail,
    _id: { $ne: new mongoose.Types.ObjectId(userId) },
  });
  if (conflict) return null;
  return User.findByIdAndUpdate(
    userId,
    {
      $set: {
        email: lowerEmail,
        googleLinked: true,
        ...(avatarUrl ? { avatarUrl } : {}),
      },
    },
    { new: true }
  );
}

export async function findUserByEmail(email: string): Promise<IUser | null> {
  await connectDB();
  return User.findOne({ email: email.toLowerCase() }).select("+passwordHash");
}

export async function createUserWithEmail(
  email: string,
  username: string,
  passwordHash: string
): Promise<IUser> {
  await connectDB();
  return User.create({
    email: email.toLowerCase(),
    username,
    passwordHash,
    authProvider: "email",
  });
}

export async function getUserById(id: string): Promise<IUser | null> {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return User.findById(id);
}

export async function getUserByWallet(
  walletAddress: string
): Promise<IUser | null> {
  await connectDB();
  return User.findOne({ walletAddress: walletAddress.toLowerCase() });
}

export async function linkWalletToUser(
  userId: string,
  walletAddress: string
): Promise<IUser | null> {
  await connectDB();
  return User.findByIdAndUpdate(
    userId,
    { walletAddress: walletAddress.toLowerCase(), authProvider: "wallet" },
    { new: true }
  );
}

export async function updateUser(
  userId: string,
  updates: { username?: string; bio?: string }
): Promise<IUser | null> {
  await connectDB();
  if (!mongoose.Types.ObjectId.isValid(userId)) return null;

  // Check username uniqueness if changing
  if (updates.username) {
    const existing = await User.findOne({
      username: updates.username,
      _id: { $ne: new mongoose.Types.ObjectId(userId) },
    });
    if (existing) throw new Error("Username already taken");
  }

  return User.findByIdAndUpdate(
    userId,
    { $set: updates },
    { new: true }
  );
}
