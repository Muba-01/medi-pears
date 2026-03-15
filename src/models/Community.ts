import mongoose, { Document, Model, Schema } from "mongoose";

export interface ICommunity extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  bannerUrl: string;
  iconUrl: string;
  createdBy: mongoose.Types.ObjectId;
  membersCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const CommunitySchema = new Schema<ICommunity>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, default: "" },
    bannerUrl: { type: String, default: "" },
    iconUrl: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    membersCount: { type: Number, default: 1, min: 0 },
  },
  { timestamps: true }
);

const Community: Model<ICommunity> =
  mongoose.models.Community ??
  mongoose.model<ICommunity>("Community", CommunitySchema);

export default Community;
