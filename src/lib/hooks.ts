"use client";

import { useEffect, useState } from "react";
import {
  clearSessionUserSilently,
  getSessionUser,
  hasSessionCookie,
  hydrateSessionUser,
  sessionEventName,
} from "@/lib/auth";
import { fetchCurrentUser } from "@/lib/backend-api";
import type { SessionUser } from "@/types";

export function useSessionUser(): SessionUser | null {
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let active = true;

    const syncUser = async () => {
      const cachedUser = getSessionUser();

      if (active) {
        setSessionUser(cachedUser);
      }

      if (!cachedUser && !hasSessionCookie()) {
        return;
      }

      try {
        const freshUser = await fetchCurrentUser();

        hydrateSessionUser(freshUser);

        if (active) {
          setSessionUser(freshUser);
        }
      } catch {
        clearSessionUserSilently();

        if (active) {
          setSessionUser(null);
        }
      }
    };

    void syncUser();

    const handleSync = () => {
      void syncUser();
    };

    window.addEventListener("storage", handleSync);
    window.addEventListener(sessionEventName(), handleSync);

    return () => {
      active = false;
      window.removeEventListener("storage", handleSync);
      window.removeEventListener(sessionEventName(), handleSync);
    };
  }, []);

  return sessionUser;
}
