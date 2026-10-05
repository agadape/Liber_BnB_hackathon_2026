import Link from "next/link";
import Image from "next/image";
import { PageShell } from "@/components/ui/PageShell";
import { PageHeading } from "@/components/ui/PageHeading";
import { OnboardingForm } from "@/components/OnboardingForm";

export default function OnboardingPage() {
  return <PageShell>
    <Image src="/illustrations/mascot-guide.jpg" alt="Liber's mascot waving hello" width={1000} height={1000} sizes="140px" loading="eager" className="onboarding-art" />
    <PageHeading eyebrow="Wallet" title="Your test wallet.">Connect a wallet or create one on this device.</PageHeading>
    <OnboardingForm />
    <p className="mt-6 text-center text-xs text-ink/65">
      By creating a wallet, you agree to Liber&apos;s{" "}
      <Link href="/terms" className="underline underline-offset-4">Terms &amp; Conditions</Link>.
    </p>
  </PageShell>;
}
