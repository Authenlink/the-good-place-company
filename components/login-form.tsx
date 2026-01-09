"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building2, User } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"user" | "business">("user");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe invalide");
        setIsLoading(false);
        return;
      }

      if (result?.ok) {
        // Get the session to determine account type and redirect accordingly
        const session = await getSession();

        if (session?.user?.accountType === "business") {
          router.push("/business/dashboard");
        } else {
          router.push("/feed");
        }
        router.refresh();
      }
    } catch (err) {
      setError("Une erreur s'est produite. Veuillez réessayer.");
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Bienvenue</CardTitle>
          <CardDescription>Connectez-vous à votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {/* Account Type Toggle - for UX clarity */}
              <Field>
                <Tabs
                  value={accountType}
                  onValueChange={(value) =>
                    setAccountType(value as "user" | "business")
                  }
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger
                      value="user"
                      className="flex items-center gap-2"
                    >
                      <User className="size-4" />
                      Utilisateur
                    </TabsTrigger>
                    <TabsTrigger
                      value="business"
                      className="flex items-center gap-2"
                    >
                      <Building2 className="size-4" />
                      Entreprise
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
                <FieldDescription className="text-center text-xs mt-2">
                  Vous serez redirigé selon votre type de compte réel
                </FieldDescription>
              </Field>

              {error && (
                <Field>
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                </Field>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
                  <a
                    href="#"
                    className="ml-auto text-sm underline-offset-4 hover:underline text-muted-foreground hover:text-primary"
                  >
                    Mot de passe oublié ?
                  </a>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>
              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading ? "Connexion en cours..." : "Se connecter"}
                </Button>
                <FieldDescription className="text-center">
                  Vous n&apos;avez pas de compte ?{" "}
                  <a href="/signup" className="text-primary hover:underline">
                    S&apos;inscrire
                  </a>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        En cliquant sur continuer, vous acceptez nos{" "}
        <a href="#" className="text-primary hover:underline">
          Conditions d&apos;utilisation
        </a>{" "}
        et notre{" "}
        <a href="#" className="text-primary hover:underline">
          Politique de confidentialité
        </a>
        .
      </FieldDescription>
    </div>
  );
}
