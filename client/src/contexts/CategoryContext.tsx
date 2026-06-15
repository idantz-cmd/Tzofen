import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type CategoryKey =
  | "home"
  | "matches"
  | "ai"
  | "cup"
  | "leaderboard"
  | "profile"
  | "news";

interface CategoryContextValue {
  category: CategoryKey;
  setCategory: (c: CategoryKey) => void;
}

const CategoryContext = createContext<CategoryContextValue>({
  category: "home",
  setCategory: () => {},
});

export function CategoryProvider({ children }: { children: ReactNode }) {
  const [category, setCategoryState] = useState<CategoryKey>("home");
  const setCategory = useCallback((c: CategoryKey) => setCategoryState(c), []);
  return (
    <CategoryContext.Provider value={{ category, setCategory }}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  return useContext(CategoryContext);
}
