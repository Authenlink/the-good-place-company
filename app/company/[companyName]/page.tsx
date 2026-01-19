"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function CompanyPage() {
  const params = useParams();
  const router = useRouter();
  const companyName = params.companyName as string;

  useEffect(() => {
    if (companyName) {
      router.replace(`/associations/${encodeURIComponent(companyName)}`);
    }
  }, [companyName, router]);

  return null;
}
