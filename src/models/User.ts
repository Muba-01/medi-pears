import mongoose, { Document, Model, Schema } from "mongoose";

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  walletAddress?: string;
  email?: string;
  username: string;
  bio: string;
  avatarUrl: string;
  karma: number;
  tokenBalance: number;
  passwordHash?: string;
  googleLinked: boolean;
  authProvider: "wallet" | "google" | "email";
  joinedCommunities: mongoose.Types.ObjectId[];
  // Anti-token farming fields
  eligibleForRewards: boolean;
  trustScoreAverage: number;
  crediblePostCount: number;
  rewardEligibilityCheckedAt?: Date;
  // Anti-Sybil fields
  signupIP?: string;
  accountAgeMinimumMet: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    walletAddress: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, trim: true },
    bio: { type: String, default: "" },
    avatarUrl: { type: String, default: "" },
    karma: { type: Number, default: 0, min: 0 },
    tokenBalance: { type: Number, default: 0, min: 0 },
    passwordHash: { type: String, select: false },
    googleLinked: { type: Boolean, default: false },
    authProvider: { type: String, enum: ["wallet", "google", "email"], required: true },
    joinedCommunities: [{ type: Schema.Types.ObjectId, ref: "Community" }],
    // Anti-token farming fields
    eligibleForRewards: { type: Boolean, default: false },
    trustScoreAverage: { type: Number, default: 0, min: 0, max: 1 },
    crediblePostCount: { type: Number, default: 0, min: 0 },
    rewardEligibilityCheckedAt: { type: Date, default: null },
    // Anti-Sybil fields
    signupIP: { type: String, default: null },
    accountAgeMinimumMet: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Delete cached model in development so schema changes are picked up after hot-reload
if (process.env.NODE_ENV !== "production") {
  delete (mongoose.models as Record<string, unknown>).User;
}

const User: Model<IUser> = mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
