"use client";

import { use } from "react";
import { DemoSetupLayout } from "@/components/demo/DemoSetupLayout";
import { DemoPreview } from "@/components/demo/DemoPreview";
import { StagesStep } from "@/components/demo/steps/StagesStep";

type Props = {
  params: Promise<{ token: string }>;
};

export default function StagesSetupPage({ params }: Props) {
  const { token } = use(params);

  return (
    <DemoSetupLayout token={token} preview={<DemoPreview />}>
      <StagesStep />
    </DemoSetupLayout>
  );
}
