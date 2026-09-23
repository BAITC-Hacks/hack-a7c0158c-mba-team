import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Sana — задачи для команд",
  description: "Каталог бизнес-задач и предложений студенческих команд",
};

const navigation = [
  { href: "/business/new", label: "Создать задачу" },
  { href: "/catalog", label: "Каталог задач" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">AI Sana</Link>
          <nav aria-label="Основная навигация">
            {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </nav>
        </header>
        <main className="container">{children}</main>
      </body>
    </html>
  );
}
