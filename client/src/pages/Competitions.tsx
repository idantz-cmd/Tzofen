import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Swords } from "lucide-react";

export default function Competitions() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 py-20">
        <Card className="p-10 text-center border-border/30">
          <Swords className="w-14 h-14 mx-auto mb-5" style={{ color: "oklch(0.72 0.190 230)" }} />
          <h1 className="text-3xl font-black mb-3">תחרויות</h1>
          <p className="text-lg font-bold mb-2" style={{ color: "oklch(0.72 0.190 230)" }}>
            בקרוב
          </p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            אנחנו עובדים על מערכת תחרויות חדשה. נשמח לראות אותך כאן בקרוב!
          </p>
        </Card>
      </main>
    </div>
  );
}
