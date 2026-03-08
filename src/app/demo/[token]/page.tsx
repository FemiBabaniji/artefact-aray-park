import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function DemoPage({ params }: Props) {
  const { token } = await params;

  // Redirect to identity setup as the first step
  redirect(`/demo/${token}/setup/identity`);
}
