import logoAsset from "@/assets/logotipo-horizontal-TEMPLAR.jpg.asset.json";

export function TemplarLogo({
  size = "md",
  stacked = false,
  className = "",
}: {
  size?: "sm" | "md" | "lg";
  stacked?: boolean;
  className?: string;
}) {
  const height = size === "lg" ? "h-16" : size === "sm" ? "h-10" : "h-10";

  return (
    <div className={`flex ${stacked ? "flex-col items-center" : "items-center"} ${className}`}>
      <img
        src={logoAsset.url}
        alt="TEMPLAR ENGENHARIA"
        className={`${height} w-auto object-contain`}
      />
    </div>
  );
}
