type ShowProps = {
  when: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
};

export function Show({ when, fallback, children }: ShowProps) {
  if (when) {
    return <>{children}</>;
  } else {
    fallback ? <>{fallback}</> : null;
  }
}
