"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

function SignedIn({ children }) {
  const [profile, setProfile] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("data-traffic-auth");
    if (token) {
      setProfile(true);
    }
  }, [router]);

  return <div>{profile ? children : null}</div>;
}

export default SignedIn;
