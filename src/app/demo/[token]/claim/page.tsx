"use client";

import { use } from "react";
import { ClaimForm } from "@/components/demo/ClaimForm";

type Props = {
  params: Promise<{ token: string }>;
};

export default function ClaimPage({ params }: Props) {
  const { token } = use(params);

  return <ClaimForm token={token} />;
}
