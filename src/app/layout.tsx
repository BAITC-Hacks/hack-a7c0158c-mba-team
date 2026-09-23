import type { Metadata } from "next";
import Link from "next/link";
import { DemoDataInitializer } from "@/features/demo/DemoDataInitializer";
import { ParticleBackground } from "@/components/ParticleBackground";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Sana — задачи для команд",
  description: "Каталог бизнес-задач и предложений студенческих команд",
};

const navigation = [
  { href: "/business/new", label: "Создать задачу" },
  { href: "/catalog", label: "Каталог задач" },
  { href: "/business/responses", label: "Отклики" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <ParticleBackground />
        <DemoDataInitializer />
        <header className="site-header">
          <Link className="brand" href="/">AI Sana</Link>
          <nav aria-label="Основная навигация">
            {navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </nav>
          <Link className="auth-link" href="/auth">Войти</Link>
        </header>
        <main className="container">{children}</main>
        <footer className="site-footer">
          <div className="site-footer-inner">
            <div className="site-footer-top">
              <div className="site-footer-about">
                <Link className="brand" href="/">AI Sana</Link>
                <p>Практические бизнес-задачи и открытый выбор студенческих команд.</p>
              </div>
              <nav className="site-footer-nav" aria-label="Ссылки в подвале">
                <Link href="/">Главная</Link>
                <Link href="/business/new">Создать задачу</Link>
                <Link href="/catalog">Каталог задач</Link>
              </nav>
            </div>
            <div className="site-footer-bottom">
              <span>HackAlem AI · практический MVP</span>
              <span>Рейтинг готовности помогает начать работу вместе</span>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
