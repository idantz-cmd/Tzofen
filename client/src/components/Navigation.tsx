import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Trophy, Target, BarChart3, Users, MessageSquare, Settings, LogOut, User, Flame, TrendingUp } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <nav className="sticky top-0 z-50 border-b border-border/40" style={{ background: "oklch(0.99 0.008 228 / 0.92)", backdropFilter: "blur(24px) saturate(180%)", borderBottomColor: "oklch(0.50 0.160 240 / 0.22)" }}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shadow-md"
              style={{ background: "linear-gradient(135deg, oklch(0.58 0.165 238), oklch(0.40 0.160 248))", boxShadow: "0 2px 8px oklch(0.50 0.165 240 / 0.50)" }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 8a4 4 0 0 1 4-4h1a4 4 0 0 1 4 4v1a3 3 0 0 0 3 3h6a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H10a8 8 0 0 1-8-8Z" />
                <circle cx="8" cy="10" r="1" fill="white" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight" style={{ color: "oklch(0.20 0.060 250)" }}>betingapp</h1>
              <p className="text-[10px] leading-none" style={{ color: "oklch(0.50 0.055 240)" }}>חיזויים מקצועיים</p>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-1">
            <Link href="/matches">
              <Button variant={isActive("/matches") ? "default" : "ghost"} size="sm" className="text-sm gap-1.5">
                <Target className="w-4 h-4" />
                משחקים
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
            <Link href="/competitions">
              <Button variant={isActive("/competitions") ? "default" : "ghost"} size="sm" className="text-sm gap-1.5">
                <Users className="w-4 h-4" />
                תחרויות
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
                      style={{ background: "linear-gradient(135deg, oklch(0.58 0.165 238), oklch(0.40 0.160 248))" }}
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
                  <Link href="/competitions">
                    <DropdownMenuItem>
                      <Users className="w-4 h-4 ml-2" />
                      תחרויות
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/chat">
                    <DropdownMenuItem>
                      <MessageSquare className="w-4 h-4 ml-2" />
                      ניתוח AI
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
                      <Link href="/user-chat">
                        <DropdownMenuItem>
                          <MessageSquare className="w-4 h-4 ml-2" />
                          צ'אט קהילתי
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
  );
}
