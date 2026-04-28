// Decodes the JWT stored in localStorage and returns role + user info
// No external deps — pure base64 decode

export interface AuthUser {
  email: string;
  user_id: string;
  role: "admin" | "auditor" | string;
}

function parseJwt(token: string): AuthUser | null {
  try {
    const base64 = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map(c => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(json) as AuthUser;
  } catch {
    return null;
  }
}

export function useAuth(): AuthUser | null {
  const token = localStorage.getItem("token");
  if (!token) return null;
  return parseJwt(token);
}

export function isAdmin(): boolean {
  const token = localStorage.getItem("token");
  if (!token) return false;
  const user = parseJwt(token);
  return user?.role === "admin";
}
