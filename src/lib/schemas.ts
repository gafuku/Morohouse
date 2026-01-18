import * as z from "zod";

export const memberTypeEnum = z.enum([
  "Individual Member",
  "Chapter Member",
  "Fellow",
  "Alumni",
]);

export const userRoleEnum = z.enum(["member", "admin", "moderator"]);

export const chapterSchema = z.object({
  name: z.string().min(2, "Chapter name is required"),
  institution: z.string().min(2, "Institution name is required"),
  location: z.string().optional(),
  presidentName: z.string().min(2, "President name is required"),
  presidentEmail: z.string().email("Invalid email"),
  email: z.string().email("Invalid chapter email"),
  foundedDate: z.string().optional(),
  status: z.enum(["Active", "Inactive", "Pending"]), // Removed default to enforce strict typing in form
  logoUrl: z.string().optional(),
});

export const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email(),
  phoneNumber: z.string().optional(),
  school: z.string().optional(),
  chapterId: z.string().optional(),
  chapterApprovalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
  major: z.string().min(2, "Major/Field of study is required"),
  interests: z.string().min(2, "Interests are required"),
  affiliations: z.string().optional(), // Organizational affiliations
  membershipType: memberTypeEnum,
  membershipStatus: z.enum(["Active", "Inactive", "Pending", "Invalid"]),
  joinDate: z.string(),
  chapterJoinDate: z.string().optional(),
  intakeCohort: z.string().optional(),
  role: userRoleEnum, // 'admin', 'moderator' (chapter officer), 'member'
  skills: z.string().optional(),
  socialLinks: z
    .object({
      linkedin: z.string().url().optional().or(z.literal("")),
      twitter: z.string().url().optional().or(z.literal("")),
      instagram: z.string().url().optional().or(z.literal("")),
    })
    .optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

// ... (opportunitySchema can stay as matches context, but I need to be careful with replace range)
// I will target just profileSchema block

export const opportunitySchema = z.object({
  title: z.string().min(5, "Title is too short"),
  organization: z.string().min(2, "Organization is required"),
  type: z.enum([
    "Internship",
    "Fellowship",
    "Job",
    "Scholarship",
    "Conference",
  ]),
  location: z.string().min(2, "Location is required"),
  deadline: z.string().refine((date) => new Date(date) > new Date(), {
    message: "Deadline must be in the future",
  }),
  description: z.string().min(20, "Please provide a detailed description"),
  link: z.string().url("Must be a valid URL"),
  tags: z.string().optional(), // Comma separated for input
  status: z.enum(["pending", "approved", "rejected"]).optional(), // Optional for form, set by backend/logic
  createdBy: z.string().optional(),
});

export const resourceSchema = z.object({
  title: z.string().min(5),
  category: z
    .enum([
      "Governance & Organizational",
      "Chapter Development",
      "Membership Experience",
      "Career Readiness",
      "Other",
    ])
    .default("Other"),
  type: z.enum(["PDF", "DOCX", "XLSX", "ZIP", "LINK"]),
  url: z.string().url(),
  size: z.string().optional(),
  tags: z.string().optional(), // Comma separated tags
  uploadedBy: z.string().optional(),
});

export const eventSchema = z.object({
  title: z.string().min(5),
  date: z.string(),
  time: z.string(),
  location: z.string(),
  description: z.string().optional(),
  createdBy: z.string().optional(),
  chapterId: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export const profileSetupSchema = profileSchema;
export type ChapterFormValues = z.infer<typeof chapterSchema>;
export type OpportunityFormValues = z.infer<typeof opportunitySchema>;
export type ResourceFormValues = z.infer<typeof resourceSchema>;
export type EventFormValues = z.infer<typeof eventSchema>;
