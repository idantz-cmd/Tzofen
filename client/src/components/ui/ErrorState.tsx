import { motion } from "framer-motion";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = "שגיאה בטעינה",
  message = "לא הצלחנו לטעון את הנתונים. בדוק את החיבור ונסה שוב.",
  onRetry,
}: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center px-4"
    >
      <span className="text-5xl mb-4 select-none">😔</span>
      <h3 className="text-lg font-bold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-5">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="border-border/30">
          נסה שוב
        </Button>
      )}
    </motion.div>
  );
}
