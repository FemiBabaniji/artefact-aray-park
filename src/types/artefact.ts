import type { Section } from "./section";

export type Artefact = {
  memberId:  string;
  sections:  Section[];
  wsContent: string;
  updatedAt: string;
};
