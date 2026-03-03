import { z } from "zod";

export const CreatePostSchema = z.object({
  title: z
    .string()
    .min(3, "Title must be at least 3 characters")
    .max(300, "Title cannot exceed 300 characters"),
  content: z.string().min(1, "Content is required").max(40_000),
  communitySlug: z
    .string()
    .min(1, "Community is required")
    .max(50)
    .regex(/^[a-z0-9_-]+$/, "Community slug must be lowercase alphanumeric"),
  tags: z.array(z.string().max(30)).max(5).default([]),
  imageUrl: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const CreateCommunitySchema = z.object({
  name: z
    .string()
    .min(3, "Name must be at least 3 characters")
    .max(50, "Name cannot exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Only letters, numbers, hyphens and underscores allowed"
    ),
  description: z.string().max(500).optional().default(""),
});

export const VoteSchema = z.object({
  voteType: z.enum(["up", "down"]),
});

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type CreateCommunityInput = z.infer<typeof CreateCommunitySchema>;
export type VoteInput = z.infer<typeof VoteSchema>;
