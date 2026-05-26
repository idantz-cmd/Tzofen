import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";

export default function UserChat() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />

      <main className="max-w-3xl mx-auto px-4 py-20">
        <Card className="p-10 text-center border-border/30">
          <MessageSquare className="w-14 h-14 mx-auto mb-5 text-primary" />
          <h1 className="text-3xl font-black mb-3">צ'אט</h1>
          <p className="text-lg font-bold mb-2 text-primary">בקרוב</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            פיצ'ר השיחות בין משתמשים בפיתוח. בקרוב תוכל לדבר ולהתאתגר מול חברים!
          </p>
        </Card>
      </main>
    </div>
  );
}
