
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth, useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { doc, getDoc } from 'firebase/firestore';

const GoogleIcon = () => (
  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25C22.56 11.45 22.49 10.68 22.36 9.92H12V14.45H18.02C17.74 15.93 16.92 17.22 15.63 18.09V20.6H19.36C21.43 18.73 22.56 15.75 22.56 12.25Z" fill="#4285F4"/>
    <path d="M12 23C15.02 23 17.58 21.99 19.36 20.6L15.63 18.09C14.65 18.73 13.42 19.12 12 19.12C9.09 19.12 6.61 17.14 5.76 14.59H2V17.1C3.78 20.58 7.56 23 12 23Z" fill="#34A853"/>
    <path d="M5.76 14.59C5.58 14.07 5.48 13.53 5.48 13C5.48 12.47 5.58 11.93 5.76 11.41V8.91H2C1.2 10.22 0.76 11.56 0.76 13C0.76 14.44 1.2 15.78 2 17.1L5.76 14.59Z" fill="#FBBC05"/>
    <path d="M12 6.88C13.56 6.88 14.88 7.42 15.9 8.35L19.43 4.92C17.58 3.14 15.02 2 12 2C7.56 2 3.78 4.42 2 7.9L5.76 10.41C6.61 7.86 9.09 6.88 12 6.88Z" fill="#EA4335"/>
  </svg>
);

const loginSchema = z.object({
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(1, { message: 'A senha não pode estar em branco.' }),
});

const registerSchema = z.object({
  name: z.string().min(2, { message: 'O nome deve ter pelo menos 2 caracteres.' }),
  email: z.string().email({ message: 'Por favor, insira um email válido.' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres.' }),
});


export default function Home() {
  const router = useRouter();
  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const [activeTab, setActiveTab] = useState("login");
  const { toast } = useToast();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });

  const checkFinancialData = async (userId: string) => {
    if (!firestore) return false;
    const userDocRef = doc(firestore, 'users', userId);
    try {
      const docSnap = await getDoc(userDocRef);
      return docSnap.exists() && docSnap.data().salary;
    } catch (error) {
      console.error("Error checking financial data:", error);
      return false;
    }
  };

  const handleSuccessfulLogin = async (userId: string) => {
    const hasData = await checkFinancialData(userId);
    if (hasData) {
      router.push('/dashboard');
    } else {
      router.push('/dashboard'); // Will show setup form anyway
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    if (!auth) return;
    try {
      const result = await signInWithPopup(auth, provider);
      await handleSuccessfulLogin(result.user.uid);
    } catch (error) {
      console.error('Error signing in with Google', error);
      toast({ variant: 'destructive', title: 'Erro no Login', description: 'Não foi possível fazer login com o Google.' });
    }
  };

  const handleEmailLogin = async (values: z.infer<typeof loginSchema>) => {
    if (!auth) return;
    try {
      const result = await signInWithEmailAndPassword(auth, values.email, values.password);
      await handleSuccessfulLogin(result.user.uid);
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        toast({ variant: 'destructive', title: 'Erro no Login', description: 'Email ou senha inválidos.' });
      } else {
        console.error('Error signing in with email', error);
        toast({ variant: 'destructive', title: 'Erro no Login', description: 'Ocorreu um erro inesperado.' });
      }
    }
  }

  const handleEmailRegister = async (values: z.infer<typeof registerSchema>) => {
    if (!auth) return;
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
      await updateProfile(userCredential.user, { displayName: values.name });
      await handleSuccessfulLogin(userCredential.user.uid);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast({
          variant: 'destructive',
          title: 'Erro no Registro',
          description: 'Este email já está em uso. Por favor, tente fazer login ou use um email diferente.',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Erro no Registro',
          description: 'Não foi possível criar a conta. Verifique os dados e tente novamente.',
        });
      }
    }
  }

  useEffect(() => {
    if (!isUserLoading && user) {
        handleSuccessfulLogin(user.uid);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8 text-primary"
          >
            <line x1="12" x2="12" y1="2" y2="22" />
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <h1 className="text-3xl font-bold text-foreground font-headline">
            CLT AI
          </h1>
        </div>
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-headline">Bem-vindo(a)!</CardTitle>
            <CardDescription>Escolha como você quer acessar sua conta.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Entrar</TabsTrigger>
                <TabsTrigger value="register">Criar Conta</TabsTrigger>
              </TabsList>
              <TabsContent value="login" className="space-y-4 pt-4">
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleEmailLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Sua senha" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">Entrar com Email</Button>
                  </form>
                </Form>
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Ou continue com
                    </span>
                  </div>
                </div>
                <Button onClick={handleGoogleSignIn} variant="outline" className="w-full">
                  <GoogleIcon />
                  <span className="ml-2">Entrar com o Google</span>
                </Button>
              </TabsContent>
              <TabsContent value="register" className="pt-4">
                <Form {...registerForm}>
                  <form onSubmit={registerForm.handleSubmit(handleEmailRegister)} className="space-y-4">
                    <FormField
                      control={registerForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome</FormLabel>
                          <FormControl>
                            <Input placeholder="Seu nome" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input placeholder="seu@email.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={registerForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Senha</FormLabel>
                          <FormControl>
                            <Input type="password" placeholder="Crie uma senha forte" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full">Criar Conta</Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    