import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Link, useLocation } from "wouter";
import { Button } from "./ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { Trophy, Target, BarChart3, Users, MessageSquare, Settings, LogOut, User, Flame, TrendingUp, Brain, Newspaper } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { NewsTicker } from "./layout/NewsTicker";

export default function Navigation() {
  const { user, logout, isAuthenticated } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="sticky top-0 z-50">
    <nav className="border-b border-border/40" style={{ background: "oklch(0.99 0.008 228 / 0.92)", backdropFilter: "blur(24px) saturate(180%)", borderBottomColor: "oklch(0.50 0.160 240 / 0.22)" }}>
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity select-none">
            {/* Icon: Star of David on Israeli blue */}
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(150deg, #0038A8, #001E6B)", boxShadow: "0 2px 10px #0038A855" }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <polygon points="12,2.5 21,18.5 3,18.5" stroke="white" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
                <polygon points="12,21.5 3,5.5 21,5.5" stroke="white" strokeWidth="1.6" fill="none" strokeLinejoin="round"/>
              </svg>
            </div>
            {/* Text: GetWin✡IL framed by Israeli flag stripes */}
            <div className="leading-none" dir="ltr">
              <div className="h-[2px] rounded-full mb-[3px]" style={{ background: "#0038A8" }} />
              <div className="flex items-center">
                <span className="font-light text-[1.05rem] tracking-tight" style={{ color: "#0038A8", fontFamily: "'Rubik', sans-serif" }}>Get</span>
                <span className="font-black text-[1.05rem] tracking-tight" style={{ color: "#0038A8", fontFamily: "'Rubik', sans-serif" }}>Win</span>
                <span className="text-[9px] font-bold mx-[1px] relative" style={{ color: "#0038A8", top: "-1px" }}>✡</span>
                <span className="font-black text-[1.05rem] tracking-tight" style={{ color: "#0038A8", fontFamily: "'Rubik', sans-serif" }}>L</span>
              </div>
              <div className="h-[2px] rounded-full mt-[3px]" style={{ background: "#0038A8" }} />
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
                style={isActive("/cup") ? {} : { color: "oklch(0.78 0.170 70)" }}
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
                  <Link href="/cup">
                    <DropdownMenuItem>
                      <Trophy className="w-4 h-4 ml-2" style={{ color: "oklch(0.78 0.170 70)" }} />
                      גביע המדינה
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/competitions">
                    <DropdownMenuItem>
                      <Users className="w-4 h-4 ml-2" />
                      תחרויות
                    </DropdownMenuItem>
                  </Link>
                  <Link href="/ai-prediction">
                    <DropdownMenuItem>
                      <Brain className="w-4 h-4 ml-2" />
                      ניבוי AI
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
    <NewsTicker />
    </div>
  );
}
