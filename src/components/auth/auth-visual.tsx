import Image from "next/image";

type AuthVisualProps = {
  alt: string;
  description: string;
  eyebrow: string;
  heading: string;
  label: string;
};

export function AuthVisual({
  alt,
  description,
  eyebrow,
  heading,
  label,
}: AuthVisualProps) {
  return (
    <aside className="signup-visual" aria-label={label}>
      <Image
        src="/auth/fashion-dress-campaign.webp"
        alt={alt}
        fill
        preload
        sizes="(min-width: 1024px) 58vw, 100vw"
        className="signup-visual-image"
      />
      <div aria-hidden="true" className="signup-visual-gradient" />
      <div className="signup-visual-copy">
        <p className="signup-visual-eyebrow">{eyebrow}</p>
        <h2 className="signup-visual-heading">{heading}</h2>
        <p className="signup-visual-description">{description}</p>
      </div>
    </aside>
  );
}
