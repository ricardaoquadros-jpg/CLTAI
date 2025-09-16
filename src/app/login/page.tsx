import AuthCard from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthCard
      title="Bem-vindo de Volta"
      description="Faça login para acessar seu painel financeiro."
      footerText="Não tem uma conta?"
      footerLinkText="Cadastre-se"
      footerHref="/signup"
    >
      <LoginForm />
    </AuthCard>
  );
}
