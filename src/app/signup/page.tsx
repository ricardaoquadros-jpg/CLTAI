import AuthCard from '@/components/auth/AuthCard';
import { SignUpForm } from '@/components/auth/SignUpForm';

export default function SignUpPage() {
  return (
    <AuthCard
      title="Create an Account"
      description="Start your journey to financial clarity today."
      footerText="Already have an account?"
      footerLinkText="Sign In"
      footerHref="/login"
    >
      <SignUpForm />
    </AuthCard>
  );
}
