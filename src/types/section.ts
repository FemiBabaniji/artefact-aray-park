export type SectionStatus =
  | "empty"
  | "in_progress"
  | "submitted"
  | "reviewed"
  | "accepted";

export type SectionKey =
  | "practice"
  | "focus"
  | "material"
  | "influences"
  | "series"
  | "exhibition"
  | "collab";

export type LinkMeta = {
  url:          string;
  title?:       string;
  description?: string;
  image?:       string;
  siteName?:    string;
  favicon?:     string;
  type?:        "article" | "video" | "image" | "website";
  fetched:      boolean;
  error?:       boolean;
};

export type Section = {
  id:          SectionKey;
  label:       string;
  status:      SectionStatus;
  evidence:    string;
  cp:          1 | 2;
  feedback?:   string;
  feedbackAt?: string;
  feedbackBy?: string;
  links?:      LinkMeta[];
};
