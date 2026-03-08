"use client";

import { use } from "react";
import { DemoSetupLayout } from "@/components/demo/DemoSetupLayout";
import { DemoPreview } from "@/components/demo/DemoPreview";
import { IdentityStep } from "@/components/demo/steps/IdentityStep";

type Props = {
  params: Promise<{ token: string }>;
};

export default function IdentitySetupPage({ params }: Props) {
  const { token } = use(params);

  return (
    <DemoSetupLayout token={token} preview={<DemoPreview />}>
      <IdentityStep />
    </DemoSetupLayout>
  );
}
