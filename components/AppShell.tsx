"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./Icon";

const nav = [["/", "home", "Home"], ["/scan", "scan", "Scan"], ["/saved", "saved", "Saved"], ["/listings", "listings", "Listings"]] as const;
export function AppShell({ children, title = "Home", eyebrow = "Your resale workspace" }: { children: React.ReactNode; title?: string; eyebrow?: string }) {
  const pathname = usePathname();
  const active = (href: string) => pathname === href || (href !== "/" && pathname.startsWith(href));
  return <div className="min-h-screen bg-canvas lg:flex">
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-[#091715] px-4 py-7 lg:flex">
      <Link href="/" className="mb-14 flex items-center gap-3 px-3 text-xl font-bold tracking-tight text-white"><span className="grid h-9 w-9 rotate-[-8deg] place-items-center rounded-xl bg-emerald text-[#071310]"><Icon name="tag" size={23} stroke={2.4} /></span><span>SellerApp</span></Link>
      <nav className="space-y-2">{nav.map(([href, icon, label]) => <Link key={href} href={href} className={`flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-semibold ${active(href) ? "bg-[#075b3b] text-white shadow-[0_8px_24px_rgba(7,91,59,.25)]" : "text-muted hover:bg-[#10251f] hover:text-white"}`}><Icon name={icon} size={21} />{label}</Link>)}</nav>
      <div className="mt-6 border-t border-line pt-5"><Link href="/settings" className={`flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-semibold ${pathname.startsWith("/settings") ? "bg-[#075b3b] text-white" : "text-muted hover:bg-[#10251f] hover:text-white"}`}><Icon name="settings" size={21} />Settings</Link></div>
      <div className="mt-auto rounded-2xl border border-line bg-[#10251f] p-4"><p className="text-xs font-bold uppercase tracking-[.18em] text-emerald">Live research</p><p className="mt-2 text-sm leading-5 text-muted">Marketplace credentials stay server-side.</p></div>
    </aside>
    <main className="w-full max-w-[1480px] px-5 pb-36 pt-7 sm:px-8 lg:mx-auto lg:px-10 lg:pb-12 lg:pt-9"><header className="mb-8 flex items-start justify-between"><div><p className="mb-2 text-xs font-bold uppercase tracking-[.22em] text-emerald">{eyebrow}</p><h1 className="display-title text-4xl font-bold text-white sm:text-5xl">{title}</h1></div><div className="grid h-11 w-11 place-items-center rounded-full bg-emerald text-sm font-bold text-[#071310]">JO</div></header>{children}</main>
    <nav className="fixed inset-x-0 bottom-0 z-10 flex justify-around border-t border-[#21483b] bg-[#091715] px-2 py-3 shadow-[0_-6px_18px_rgba(0,0,0,.18)] lg:hidden">{nav.map(([href, icon, label]) => <Link key={href} href={href} className={`flex min-w-16 flex-col items-center gap-1 text-[11px] font-semibold ${active(href) ? "text-emerald" : "text-white/80"}`}><Icon name={icon} size={20} />{label}</Link>)}</nav>
  </div>;
}
