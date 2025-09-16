import AuthCard from '@/components/auth/AuthCard';
import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUpPage() {
  return (
    <AuthCard
      title="Crie uma Conta"
      description="Comece sua jornada para a clareza financeira hoje."
      footerText="Já tem uma conta?"
      footerLinkText="Faça Login"
      footerHref="/login"
    >
      <SignUpForm />
    </AuthCard>
  );
}
