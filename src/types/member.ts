export type Stage =
  | "pending"
  | "entry"
  | "foundation"
  | "development"
  | "showcase"
  | "graduate";

export type ArtefactRole = "member" | "mentor" | "admin";

export type MemberProfile = {
  practice:     string;
  focus:        string;
  goals:        string[];
  influences:   string[];
  skills: {
    Primary:  string[];
    Tools:    string[];
    Mediums:  string[];
  };
  projects: {
    name:  string;
    works: { title: string; year: string }[];
  }[];
  availability?: string;
};

export type Member = {
  id:           string;
  name:         string;
  initials:     string;
  title:        string;
  email:        string;
  phone?:       string;
  location:     string;
  avatarUrl?:   string;
  color:        string;
  stage:        Stage;
  risk:         boolean;
  sections:     number;
  accepted:     number;
  profile?:     MemberProfile;
};
