import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TypographyH2, TypographyMuted, TypographySmall } from "@/components/ui/typography";
import ThemeToggle from "@/components/ThemeToggle";
import { AlertCircle, Loader2 } from "lucide-react";

// Create the login schema
const loginSchema = z.object({
  employeeId: z.string()
    .min(1, "Employee ID is required"),
  password: z.string()
    .min(1, "Password is required"),
  rememberMe: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginPageProps {
  setIsAuthenticated: (value: boolean) => void;
}

export default function LoginPage({ setIsAuthenticated }: LoginPageProps) {
  const { toast } = useToast();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      employeeId: "",
      password: "",
      rememberMe: false
    }
  });
  
  const loginMutation = useMutation({
    mutationFn: (data: LoginFormData) => {
      return apiRequest("POST", "/api/auth/login", {
        employeeId: data.employeeId,
        password: data.password
      });
    },
    onSuccess: async (response) => {
      const data = await response.json();
      
      // Save login state if remember me is checked
      if (form.getValues("rememberMe")) {
        localStorage.setItem("isLoggedIn", "true");
      }
      
      setIsAuthenticated(true);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${data.name || 'Employee'}!`
      });
    },
    onError: (error: Error) => {
      setErrorMessage("Invalid employee ID or password. Please try again.");
      
      setTimeout(() => {
        setErrorMessage(null);
      }, 5000);
    }
  });
  
  const onSubmit = (data: LoginFormData) => {
    setErrorMessage(null);
    loginMutation.mutate(data);
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="py-3 px-4 md:px-6 flex justify-between items-center bg-secondary">
        <div className="flex items-center">
          <svg className="h-10 w-10 text-accent mr-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <h1 className="text-xl font-semibold">IDMS Infotech</h1>
        </div>
        
        <ThemeToggle />
      </header>
      
      {/* Main content */}
      <main className="flex-grow flex items-center justify-center px-4 py-12">
        <Card className="max-w-md w-full card-shadow rounded-lg overflow-hidden bg-secondary">
          <CardContent className="px-6 py-8">
            <div className="text-center mb-8">
              <TypographyH2 className="mb-1">Employee Login</TypographyH2>
              <TypographyMuted>Access your IDMS Infotech portal</TypographyMuted>
            </div>
            
            {errorMessage && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="employeeId" className="text-muted-foreground">
                  Employee ID
                </Label>
                <Input
                  id="employeeId"
                  type="text"
                  placeholder="Enter your employee ID"
                  className="bg-primary text-foreground border-muted-foreground focus:border-accent focus:ring-accent"
                  {...form.register("employeeId")}
                />
                {form.formState.errors.employeeId && (
                  <p className="text-xs text-destructive mt-1">
                    {form.formState.errors.employeeId.message}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label htmlFor="password" className="text-muted-foreground">
                    Password
                  </Label>
                  <a href="#" className="text-xs font-medium hover:underline text-accent">
                    Forgot password?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  className="bg-primary text-foreground border-muted-foreground focus:border-accent focus:ring-accent"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  {...form.register("rememberMe")}
                />
                <Label htmlFor="rememberMe" className="text-muted-foreground text-sm">
                  Remember me
                </Label>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-accent hover:bg-accent/90"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center">
              <TypographySmall className="text-muted-foreground">
                Having trouble logging in? <a href="#" className="font-medium hover:underline text-accent">Contact IT Support</a>
              </TypographySmall>
            </div>
          </CardContent>
          
          <div className="px-6 py-3 text-center bg-background/5">
            <TypographySmall className="text-muted-foreground">
              &copy; {new Date().getFullYear()} IDMS Infotech. All rights reserved.
            </TypographySmall>
          </div>
        </Card>
      </main>
    </div>
  );
}
