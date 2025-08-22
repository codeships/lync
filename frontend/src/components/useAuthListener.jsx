import { useState, useEffect } from "react";
import { auth } from "../../lib/firebase";
import { onAuthStateChanged, reload } from "firebase/auth";

export function useAuthListener() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // ensure latest profile values
        await reload(u);
        setUser(auth.currentUser);
      } else {
        setUser(null);
      }
    });
    return () => unsub();
  }, []);

  return user;
}
