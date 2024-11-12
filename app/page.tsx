// app/page.tsx
"use client";

import UserMenu from "../components/UserMenu";
import CodeQualityForm from "../components/CodeQualityForm";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            Strive Tech Challenge
          </h1>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <CodeQualityForm />
      </main>
    </div>
  );
}
