// app/not-found.tsx
import { redirect } from "next/navigation";

export default function NotFound() {
  // qualquer rota inexistente cai aqui -> manda para /dashboard
  redirect("/dashboard");
}
