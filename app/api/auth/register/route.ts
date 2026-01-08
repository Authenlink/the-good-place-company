import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, companies } from "@/lib/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      email,
      password,
      name,
      accountType = "user",
      companyName,
      companyDescription,
    } = body;

    // Validation de base
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      );
    }

    // Validation du type de compte
    if (accountType !== "user" && accountType !== "business") {
      return NextResponse.json(
        { error: "Invalid account type" },
        { status: 400 }
      );
    }

    // Si compte business, le nom de l'entreprise est requis
    if (accountType === "business" && !companyName) {
      return NextResponse.json(
        { error: "Company name is required for business accounts" },
        { status: 400 }
      );
    }

    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validation mot de passe (minimum 8 caractères)
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser.length > 0) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const newUser = await db
      .insert(users)
      .values({
        email,
        name,
        password: hashedPassword,
        accountType,
      })
      .returning();

    const createdUser = newUser[0];

    // Si compte business, créer l'entrée dans la table companies
    let companyData = null;
    if (accountType === "business") {
      const newCompany = await db
        .insert(companies)
        .values({
          userId: createdUser.id,
          name: companyName,
          description: companyDescription || null,
        })
        .returning();

      companyData = {
        id: newCompany[0].id,
        name: newCompany[0].name,
        description: newCompany[0].description,
      };
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        user: {
          id: createdUser.id,
          email: createdUser.email,
          name: createdUser.name,
          accountType: createdUser.accountType,
        },
        company: companyData,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
