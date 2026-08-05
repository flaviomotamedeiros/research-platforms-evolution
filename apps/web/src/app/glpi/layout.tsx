export default function GlpiLayout({ children }: { children: React.ReactNode }) {
  // Scopes GLPI's series-1 accent (indigo) for charts/bars.
  return <div className="theme-glpi">{children}</div>
}
