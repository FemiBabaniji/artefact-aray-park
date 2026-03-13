import type { StandaloneRoom, Identity } from "@/types/artefact";

export type WizardStep = {
  id: string;
  num: number;
  label: string;
};

export type TypingState = {
  [blockId: string]: {
    target: string;
    displayed: string;
    isTyping: boolean;
  };
};

export type WizardLayoutProps = {
  started: boolean;
  dark: boolean;
  welcomeContent: React.ReactNode;
  leftPanelHeader: React.ReactNode;
  leftPanelContent: React.ReactNode;
  rightPanelContent: React.ReactNode;
  rightPanelFullscreen?: boolean;
};

export type MockArtefactProviderProps = {
  children: React.ReactNode;
  rooms: StandaloneRoom[];
  identity: Identity;
  focusedRoomId?: string | null;
};

export type ArtefactPreviewPanelProps = {
  rooms: StandaloneRoom[];
  identity: Identity;
  showExpanded?: boolean;
  focusedRoomId?: string | null;
  fullscreen?: boolean;
};

export type StepAccordionProps = {
  steps: WizardStep[];
  currentStep: number;
  doneSteps: Set<string>;
  onStepClick: (stepNum: number) => void;
  renderStepContent: (step: WizardStep) => React.ReactNode;
  renderStepAction: (step: WizardStep) => React.ReactNode;
};
