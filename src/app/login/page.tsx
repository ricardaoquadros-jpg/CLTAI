import AuthCard from '@/components/auth/AuthCard';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  return (
    <AuthCard
      title="Welcome Back"
      description="Sign in to access your financial dashboard."
      footerText="Don't have an account?"
      footerLinkText="Sign Up"
      footerHref="/signup"
    >
      <LoginForm />
    </AuthCard>
  );
}
