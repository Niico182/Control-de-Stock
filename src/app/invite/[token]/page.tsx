import { AcceptInviteForm } from "@/components/team/accept-invite-form";

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return <AcceptInviteForm token={token} />;
}
