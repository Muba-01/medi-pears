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
  authProvider: "wallet" | "google";
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
    authProvider: { type: String, enum: ["wallet", "google"], required: true },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export default User;
