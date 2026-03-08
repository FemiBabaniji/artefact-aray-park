"use client";

import { use } from "react";
import { DemoSetupLayout } from "@/components/demo/DemoSetupLayout";
import { DemoPreview } from "@/components/demo/DemoPreview";
import { SectionsStep } from "@/components/demo/steps/SectionsStep";

type Props = {
  params: Promise<{ token: string }>;
};

export default function SectionsSetupPage({ params }: Props) {
  const { token } = use(params);

  return (
    <DemoSetupLayout token={token} preview={<DemoPreview />}>
      <SectionsStep />
    </DemoSetupLayout>
  );
}
