import { icons, type LucideProps } from "lucide-react";

export function DynIcon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = (icons as Record<string, any>)[name] ?? icons.Sparkles;
  return <Cmp {...props} />;
}
