type IconProps = {
  name: string;
  filled?: boolean;
  className?: string;
};

export function Icon({ name, filled = false, className = "" }: IconProps) {
  return (
    <span className={`material-symbols-outlined ${filled ? "icon-fill" : ""} ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}
