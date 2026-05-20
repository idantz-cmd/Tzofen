import { Button } from "@/components/ui/button";
import Navigation from "@/components/Navigation";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
        <div className="text-center">
          <div className="text-6xl mb-4">404</div>
          <h1 className="text-4xl font-bold mb-4">עמוד לא נמצא</h1>
          <p className="text-lg text-muted-foreground mb-8">
            סורי, העמוד שחיפשת לא קיים
          </p>
          <Link href="/">
            <Button size="lg">
              חזור לבית
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
