import { redirect } from "next/navigation";
import { auth } from "@/app/api/auth/[...nextauth]/route";

export default async function Home() {
  const session = await auth();

  if (session) {
    // Utilisateur connecté
    if (session.user.accountType === "business") {
      // Compte entreprise -> redirection vers le dashboard business
      redirect("/business/dashboard");
    } else {
      // Compte utilisateur -> redirection vers le feed
      redirect("/feed");
    }
  } else {
    // Utilisateur non connecté -> redirection vers login
    redirect("/login");
  }
}
