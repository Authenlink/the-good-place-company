"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
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

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const router = useRouter();
  const [accountType, setAccountType] = useState<"user" | "business">("user");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    // Validation côté client
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (accountType === "business" && !companyName.trim()) {
      setError("Le nom de l'entreprise est requis");
      return;
    }

    setIsLoading(true);

    try {
      // Appeler l'API d'inscription
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          accountType,
          companyName: accountType === "business" ? companyName : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Échec de l'inscription");
        setIsLoading(false);
        return;
      }

      // Connecter automatiquement l'utilisateur après inscription
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        setError(
          "Compte créé mais échec de connexion. Veuillez essayer de vous connecter."
        );
        setIsLoading(false);
        return;
      }

      if (signInResult?.ok) {
        // Redirection selon le type de compte
        const redirectUrl =
          accountType === "business" ? "/business/dashboard" : "/dashboard";
        router.push(redirectUrl);
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
          <CardTitle className="text-xl">Créez votre compte</CardTitle>
          <CardDescription>
            Choisissez votre type de compte et remplissez vos informations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <FieldGroup>
              {/* Account Type Toggle */}
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
              </Field>

              {error && (
                <Field>
                  <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    {error}
                  </div>
                </Field>
              )}

              <Field>
                <FieldLabel htmlFor="name">
                  {accountType === "business"
                    ? "Nom du contact"
                    : "Nom complet"}
                </FieldLabel>
                <Input
                  id="name"
                  type="text"
                  placeholder={
                    accountType === "business" ? "John Doe" : "John Doe"
                  }
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </Field>

              {/* Business-specific fields */}
              {accountType === "business" && (
                <Field>
                  <FieldLabel htmlFor="companyName">
                    Nom de l&apos;entreprise
                  </FieldLabel>
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="The Good Place Company"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    disabled={isLoading}
                  />
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
                <div className="grid grid-cols-2 gap-4">
                  <Field>
                    <FieldLabel htmlFor="password">Mot de passe</FieldLabel>
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
                    <FieldLabel htmlFor="confirm-password">
                      Confirmer le mot de passe
                    </FieldLabel>
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </Field>
                </div>
                <FieldDescription>
                  Doit contenir au moins 8 caractères.
                </FieldDescription>
              </Field>

              <Field>
                <Button type="submit" disabled={isLoading} className="w-full">
                  {isLoading
                    ? "Création du compte..."
                    : accountType === "business"
                    ? "Créer un compte entreprise"
                    : "Créer un compte"}
                </Button>
                <FieldDescription className="text-center">
                  Vous avez déjà un compte ?{" "}
                  <a href="/login" className="text-primary hover:underline">
                    Se connecter
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
