export default function TextLogo({
  variant = "default",
}: {
  variant?: "default" | "short";
}) {
  switch (variant) {
    case "short":
      return (
        <h2>
          Meu<strong className="text-primary">Broadcast</strong>
        </h2>
      );
    default:
      return (
        <h1>
          Meu<strong className="text-primary">Broadcast</strong>
        </h1>
      );
  }
}
