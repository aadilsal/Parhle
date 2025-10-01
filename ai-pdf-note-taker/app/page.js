"use client";
import { Button } from "@/components/ui/button";
import { UserButton, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { create } from "domain";
import Image from "next/image";
import { useEffect } from "react";

export default function Home() {
  const { user } = useUser();
  const createUser = useMutation(api.user.createuser);

  useEffect(()=>{
    if (user && typeof window !== 'undefined') {
      CheckUser();
    }
  },[user])
  const CheckUser = async () => {
    const res = await createUser({
      email: user?.primaryEmailAddress?.emailAddress,
      imageUrl: user?.imageUrl,
      name: user?.fullName,
    });

    console.log(res);
  };
  return (
    <div>
      <h2>AI pdf note taker</h2>
      <Button>Start</Button>

      <UserButton />
    </div>
  );
}
