// app/page.tsx
import UserMenu from "../components/UserMenu";
import CodeQualityForm from "../components/CodeQualityForm";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">
            <svg
              viewBox="-2.4 -2.4 28.80 28.80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="w-14 h-14"
              aria-label="Custom Icon"
              role="img"
            >
              <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
              <g
                id="SVGRepo_tracerCarrier"
                strokeLinecap="round"
                strokeLinejoin="round"
              ></g>
              <g id="SVGRepo_iconCarrier">
                <path
                  d="M5.0333 14.8284L6.44751 16.2426L10.6902 12L6.44751 7.75733L5.0333 9.17155L7.86172 12L5.0333 14.8284Z"
                  fill="#00FF00"
                ></path>
                <path d="M15 14H11V16H15V14Z" fill="#00FF00"></path>
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M2 2C0.895431 2 0 2.89543 0 4V20C0 21.1046 0.89543 22 2 22H22C23.1046 22 24 21.1046 24 20V4C24 2.89543 23.1046 2 22 2H2ZM22 4H2L2 20H22V4Z"
                  fill="#000000"
                ></path>
              </g>
            </svg>
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
