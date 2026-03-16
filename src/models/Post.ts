import mongoose, { Document, Model, Schema } from "mongoose";

export type PostType = "text" | "image" | "link";
>>>>>>> 285550973379e98ffdd5e0ae52763a57b765120a

export interface IPost extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  postType: PostType;
  author: mongoose.Types.ObjectId;
  community: mongoose.Types.ObjectId;
  upvotes: mongoose.Types.ObjectId[];
  downvotes: mongoose.Types.ObjectId[];
  score: number;
  tags: string[];
  imageUrl?: string;
  linkUrl?: string;
  commentCount: number;
  trustScore: number;
  },
  { timestamps: true }
);

PostSchema.index({ community: 1, createdAt: -1 });
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ score: -1, createdAt: -1 });

const Post: Model<IPost> =
  mongoose.models.Post ?? mongoose.model<IPost>("Post", PostSchema);

export default Post;
