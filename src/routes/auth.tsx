import { createFileRoute } from "@tanstack/react-router";
import LoginScreen from "@/components/LoginScreen";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [
    { title: "Acesso ao ERP | TEMPLAR ENGENHARIA" },
    { name: "description", content: "Entre ou crie sua conta no ERP Templar Engenharia." },
    { property: "og:title", content: "Acesso ao ERP | TEMPLAR ENGENHARIA" },
    { property: "og:description", content: "Acesso seguro à sua conta Templar Engenharia." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: LoginScreen,
});