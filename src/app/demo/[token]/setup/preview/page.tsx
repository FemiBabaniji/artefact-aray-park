"use client";

import { use } from "react";
import { DemoSetupLayout } from "@/components/demo/DemoSetupLayout";
import { DemoPreview } from "@/components/demo/DemoPreview";
import { PreviewStep } from "@/components/demo/steps/PreviewStep";

type Props = {
  params: Promise<{ token: string }>;
};

export default function PreviewSetupPage({ params }: Props) {
  const { token } = use(params);

  return (
    <DemoSetupLayout token={token} preview={<DemoPreview />}>
      <PreviewStep token={token} />
    </DemoSetupLayout>
  );
}
