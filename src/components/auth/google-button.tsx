import { GoogleLogo } from "@phosphor-icons/react/dist/ssr";
import { signInWithGoogle } from "@/app/(auth)/actions";
import { SubmitButton } from "@/components/ui/submit-button";

export function GoogleButton({ next }: { next: string }) {
  return (
    <form action={signInWithGoogle}>
      <input type="hidden" name="next" value={next} />
      <SubmitButton variant="secondary" pendingLabel="Abrindo o Google..." className="w-full">
        <GoogleLogo size={20} weight="bold" aria-hidden />
        Continuar com o Google
      </SubmitButton>
    </form>
  );
}
