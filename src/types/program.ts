import type { Stage } from "./member";

export type StageToken = {
  id:    Stage;
  label: string;
  color: string;
};

export type Program = {
  name:       string;
  subtitle:   string;
  week:       number;
  totalWeeks: number;
  live:       boolean;
};
