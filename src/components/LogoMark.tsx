/**
 * Versatile "V" mark. Rendered as a CSS mask filled with `currentColor`,
 * so it automatically follows the light/dark theme text colour.
 */
export function LogoMark({ className = "h-[22px]" }: { className?: string }) {
  const url = "url(/images/logo-mark.png)";
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        aspectRatio: "628 / 495",
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
