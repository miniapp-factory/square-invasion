import { description, title } from "@/lib/metadata";
import { generateMetadata } from "@/lib/farcaster-embed";

export { generateMetadata };
import Game from "@/components/game";

export default function Home() {
  // NEVER write anything here, only use this page to import components
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-purple-700 via-blue-800 to-purple-900 text-white">
      <Game />
    </main>
  );
}
