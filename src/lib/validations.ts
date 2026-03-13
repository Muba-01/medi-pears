import { z } from "zod";

export const CreatePostSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(300, "Title cannot exceed 300 characters"),
  content: z.string().max(40_000).default(""),
  postType: z.enum(["text", "image", "link"]).default("text"),
  communitySlug: z
    .string()
    .min(1, "Community is required")
    .max(50)
    .regex(/^[a-z0-9_-]+$/, "Community slug must be lowercase alphanumeric"),
  tags: z.array(z.string().max(30)).max(5).default([]),
  imageUrl: z
    .string()
    .optional()
    .refine(
      (v) => !v || v.startsWith("/uploads/") || v.startsWith("/api/media/") || /^https?:\/\//i.test(v),
      "Invalid URL"
    )
    .or(z.literal("")),
  linkUrl: z.string().url("Invalid link URL").optional().or(z.literal("")),
});

export const CreateCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name cannot exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9 _-]+$/,
      "Only letters, numbers, spaces, hyphens and underscores allowed"
    ),
  description: z.string().max(500).optional().default(""),
});

export const VoteSchema = z.object({
  voteType: z.enum(["up", "down"]),
});

export const CreateCommentSchema = z.object({
  content: z
    .string()
    .min(1, "Comment cannot be empty")
    .max(10_000, "Comment is too long"),
  parentCommentId: z.string().optional(),
});

export const UpdateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username cannot exceed 30 characters")
    .regex(/^[a-zA-Z0-9_-]+$/, "Only letters, numbers, hyphens and underscores allowed")
    .optional(),
  bio: z.string().max(300, "Bio cannot exceed 300 characters").optional(),
  avatarUrl: z.string().optional(),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type CreateCommunityInput = z.infer<typeof CreateCommunitySchema>;
export type VoteInput = z.infer<typeof VoteSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
