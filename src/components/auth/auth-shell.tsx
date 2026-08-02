import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  visual: ReactNode;
};

export function AuthShell({ children, visual }: AuthShellProps) {
  return (
    <div className="signup-shell">
      {visual}
      <div className="signup-form-panel">{children}</div>
    </div>
  );
}
