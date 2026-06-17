import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Trophy, Target, BarChart3, Users, MessageSquare, Settings, LogOut, User, Flame, TrendingUp, Brain, Newspaper } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NewsTicker } from "./layout/NewsTicker";
import { TzofenLogo } from "./TzofenLogo";

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="sticky top-0 z-50">
    <nav className="border-b border-border/40" style={{ background: "rgba(255,255,255,0.92)", backdropFilter: "blur(24px) saturate(180%)", borderBottomColor: "rgba(31,107,255,0.18)" }}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity select-none">
            <TzofenLogo size={36} style={{ boxShadow: "0 2px 12px rgba(31,107,255,0.42)", borderRadius: "8px", flexShrink: 0 }} />
            <span className="font-black text-[1.15rem] tracking-tight" style={{ color: "#1F6BFF", fontFamily: "'Rubik', sans-serif" }}>
              צופן
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/matches">
              <Button variant={isActive("/matches") ? "default" : "ghost"} size="sm" className="text-sm gap-1.5">
                <Target className="w-4 h-4" />
                משחקים
              </Button>
            </Link>
            <Link href="/news">
              <Button variant={isActive("/news") ? "default" : "ghost"} size="sm" className="text-sm gap-1.5">
                <Newspaper className="w-4 h-4" />
                חדשות
              </Button>
            </Link>
            <Link href="/leaderboard">
              <Button variant={isActive("/leaderboard") ? "default" : "ghost"} size="sm" className="text-sm gap-1.5">
                <Trophy className="w-4 h-4" />
                דירוג
              </Button>
            </Link>
            <Link href="/standings">
              <Button variant={isActive("/standings") ? "default" : "ghost"} size="sm" className="text-sm gap-1.5">
                <TrendingUp className="w-4 h-4" />
                טבלאות
              </Button>
            </Link>
            <Link href="/cup">
              <Button
                variant={isActive("/cup") ? "default" : "ghost"}
                size="sm"
                className="text-sm gap-1.5"
                style={isActive("/cup") ? {} : { color: "#E6A800" }}
              >
                🏆 גביע
              </Button>
            </Link>
            <Link href="/competitions">
              <Button variant={isActive("/competitions") ? "default" : "ghost"} size="sm" className="text-sm gap-1.5">
                <Users className="w-4 h-4" />
                תחרויות
              </Button>
            </Link>
            <Link href="/ai-prediction">
              <Button variant={isActive("/ai-prediction") ? "default" : "ghost"} size="sm" className="text-sm gap-1.5">
                <Brain className="w-4 h-4" />
                ניבוי AI
              </Button>
            </Link>
            <Link href="/chat">
              <Button variant={isActive("/chat") ? "default" : "ghost"} size="sm" className="text-sm gap-1.5">
                <MessageSquare className="w-4 h-4" />
                ניתוח AI
              </Button>
            </Link>
            {isAuthenticated && (
              <>
                <Link href="/dashboard">
                  <Button variant={isActive("/dashboard") ? "default" : "ghost"} size="sm" className="text-sm gap-1.5">
                    <BarChart3 className="w-4 h-4" />
                    לוח בקרה
                  </Button>
                </Link>
                {user?.role === "admin" && (
                  <Link href="/admin">
                    <Button variant={isActive("/admin") ? "default" : "ghost"} size="sm" className="text-sm gap-1.5">
                      <Settings className="w-4 h-4" />
                      ניהול
                    </Button>
                  </Link>
                )}
              </>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 border-border/40">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, #4D8FFF, #1F6BFF)" }}
                    >
                      <User className="w-3.5 h-3.5 text-white" />
                    </div>
                    <span className="hidden sm:inline text-sm">{user?.name || "משתמש"}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem disabled>
                    <span className="text-xs text-muted-foreground">{user?.email}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard">
                    <DropdownMenuItem>
                      <BarChart3 className="w-4 h-4 ml-2" />
                      לוח בקרה
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/dashboard">
                    <DropdownMenuItem>
                      <Flame className="w-4 h-4 ml-2" />
                      הרצפים שלי
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-red-400">
                    <LogOut className="w-4 h-4 ml-2" />
                    התנתק
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="accent"
                size="sm"
                onClick={() => { window.location.href = getLoginUrl(); }}
              >
                התחבר
              </Button>
            )}

            {/* Mobile menu */}
            <div className="md:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </svg>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <Link href="/matches">
                    <DropdownMenuItem>
                      <Target className="w-4 h-4 ml-2" />
                      משחקים
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/news">
                    <DropdownMenuItem>
                      <Newspaper className="w-4 h-4 ml-2" />
                      חדשות
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/leaderboard">
                    <DropdownMenuItem>
                      <Trophy className="w-4 h-4 ml-2" />
                      דירוג
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/standings">
                    <DropdownMenuItem>
                      <TrendingUp className="w-4 h-4 ml-2" />
                      טבלאות ליגה
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/cup">
                    <DropdownMenuItem>
                      <Trophy className="w-4 h-4 ml-2" style={{ color: "#E6A800" }} />
                      גביע המדינה
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuSeparator />
                  <Link href="/ai-prediction">
                    <DropdownMenuItem>
                      <Brain className="w-4 h-4 ml-2" />
                      ניבוי AI — תחזית משחק
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/chat">
                    <DropdownMenuItem>
                      <MessageSquare className="w-4 h-4 ml-2" />
                      ניתוח AI — שאל שאלה
                    </DropdownMenuItem>
                  </Link>
                  {isAuthenticated && (
                    <>
                      <DropdownMenuSeparator />
                      <Link href="/dashboard">
                        <DropdownMenuItem>
                          <BarChart3 className="w-4 h-4 ml-2" />
                          לוח בקרה
                        </DropdownMenuItem>
                      </Link>
                      {user?.role === "admin" && (
                        <Link href="/admin">
                          <DropdownMenuItem>
                            <Settings className="w-4 h-4 ml-2" />
                            ניהול
                          </DropdownMenuItem>
                        </Link>
                      )}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </nav>
    <NewsTicker />
    </div>
  );
}
