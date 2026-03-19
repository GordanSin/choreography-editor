import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#121212] text-white flex items-center justify-center p-6">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">404</h1>
        <p className="text-zinc-400">Stranica nije pronađena</p>
        <Link href="/">
          <button className="px-4 py-2 bg-white text-black rounded-lg text-sm font-medium hover:bg-zinc-200 transition-colors">
            Natrag na Editor
          </button>
        </Link>
      </div>
    </div>
  );
}
