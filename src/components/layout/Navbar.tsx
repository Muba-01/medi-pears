"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Zap, Bell, Menu, X, LogOut, User, Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { shortenAddress } from "@/lib/utils";
import Image from "next/image";
import CreateCommunityModal from "@/components/community/CreateCommunityModal";
import { Users } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const { isAuthenticated, isLoading, walletAddress, userId, username, avatarUrl, provider, login, loginWithGoogle, logout, error } = useAuth();
  const [authMenuOpen, setAuthMenuOpen] = useState(false);
  const displayName = username ?? (walletAddress ? shortenAddress(walletAddress) : null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loginPending, setLoginPending] = useState(false);
  const [createCommunityOpen, setCreateCommunityOpen] = useState(false);

  const handleSearch = (value: string) => {
    const q = value.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleLogin = async () => {
    setLoginPending(true);
    await login();
    setLoginPending(false);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 h-14 border-b"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
      <div className="h-full max-w-7xl mx-auto px-4 flex items-center gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
            <Zap size={14} className="text-white" />
          </div>
          <span className="font-bold text-base hidden sm:block" style={{ color: "var(--foreground)" }}>
            Medipear
          </span>
        </Link>

        {/* Search bar */}
        <div className="flex-1 max-w-xl hidden md:block">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all"
            style={{
              background: "var(--surface-2)",
              borderColor: searchFocused ? "#7c3aed" : "var(--border)",
            }}>
            <Search size={14} style={{ color: "var(--muted)" }} />
            <input
              type="text"
              placeholder="Search communities and posts..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(searchValue); }}
              className="bg-transparent outline-none text-sm w-full"
              style={{ color: "var(--foreground)" }}
            />
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {isAuthenticated && (
            <Link
              href="/create"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border hover:bg-white/5 transition-all"
              style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
              <Plus size={13} />
              Create
            </Link>
          )}

          {isAuthenticated && (
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
              <Bell size={16} style={{ color: "var(--muted)" }} />
            </button>
          )}

          {/* Auth area */}
          {isLoading ? (
            <div className="w-24 h-8 rounded-lg animate-pulse" style={{ background: "var(--surface-2)" }} />
          ) : isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-white/5 transition-colors border"
                style={{ borderColor: "var(--border)" }}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={displayName ?? ""} width={24} height={24} className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                    {(displayName ?? "?").slice(0, 2).toUpperCase()}
                  </div>
                )}
                <span className="text-sm hidden md:block" style={{ color: "var(--foreground)" }}>
                  {displayName}
                </span>
              </button>

              {dropdownOpen && (
                <>
                  <button className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} style={{ background: "transparent" }} />
                  <div
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl border shadow-2xl z-20 overflow-hidden py-1"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <div className="px-4 py-2.5 border-b" style={{ borderColor: "var(--border)" }}>
                      <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{displayName}</p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                        {provider === "google" ? "Google" : "Wallet"} account
                      </p>
                    </div>
                    <Link
                      href={`/profile/${walletAddress ?? userId}`}
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                      style={{ color: "var(--foreground)" }}>
                      <User size={14} style={{ color: "var(--muted)" }} />
                      My Profile
                    </Link>
                    <Link
                      href="/create"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-white/5 transition-colors"
                      style={{ color: "var(--foreground)" }}>
                      <Plus size={14} style={{ color: "var(--muted)" }} />
                      Create Post
                    </Link>
                    <button
                      onClick={() => { setDropdownOpen(false); setCreateCommunityOpen(true); }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm w-full text-left hover:bg-white/5 transition-colors"
                      style={{ color: "var(--foreground)" }}>
                      <Users size={14} style={{ color: "var(--muted)" }} />
                      Create Community
                    </button>
                    <div className="border-t my-1" style={{ borderColor: "var(--border)" }} />
                    <button
                      onClick={async () => { setDropdownOpen(false); await logout(); }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm w-full text-left hover:bg-white/5 transition-colors"
                      style={{ color: "#f87171" }}>
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setAuthMenuOpen(!authMenuOpen)}
                disabled={loginPending}
                className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #7c3aed, #2563eb)" }}>
                {loginPending ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Zap size={13} />
                )}
                {loginPending ? "Connecting..." : "Sign In"}
              </button>
              {authMenuOpen && (
                <>
                  <button className="fixed inset-0 z-10" onClick={() => setAuthMenuOpen(false)} style={{ background: "transparent" }} />
                  <div
                    className="absolute right-0 top-full mt-2 w-52 rounded-xl border shadow-2xl z-20 overflow-hidden py-1"
                    style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                    <p className="px-4 py-2 text-xs font-semibold" style={{ color: "var(--muted)" }}>CHOOSE METHOD</p>
                    <button
                      onClick={async () => { setAuthMenuOpen(false); await handleLogin(); }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm w-full text-left hover:bg-white/5 transition-colors"
                      style={{ color: "var(--foreground)" }}>
                      <Zap size={14} style={{ color: "#a78bfa" }} />
                      Connect Wallet
                    </button>
                    <button
                      onClick={async () => { setAuthMenuOpen(false); await loginWithGoogle(); }}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm w-full text-left hover:bg-white/5 transition-colors"
                      style={{ color: "var(--foreground)" }}>
                      <svg width="14" height="14" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.3 9 3.4l6.7-6.7C35.6 2.5 30.1 0 24 0 14.7 0 6.8 5.4 3 13.3l7.8 6C12.7 13.3 17.9 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z"/><path fill="#FBBC05" d="M10.8 28.7A14.4 14.4 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7L2.5 13.3A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.5 10.7l8.3-6z"/><path fill="#34A853" d="M24 48c6.1 0 11.2-2 14.9-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.4 2.2-6.1 0-11.3-3.8-13.2-9.2l-7.8 6C6.8 42.6 14.7 48 24 48z"/></svg>
                      Continue with Google
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          <button
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? (
              <X size={16} style={{ color: "var(--muted)" }} />
            ) : (
              <Menu size={16} style={{ color: "var(--muted)" }} />
            )}
          </button>
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div
          className="absolute top-14 left-1/2 -translate-x-1/2 mt-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-lg z-50"
          style={{ background: "#dc2626" }}>
          {error}
        </div>
      )}

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div
          className="md:hidden px-4 py-3 border-t"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-3"
            style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}>
            <Search size={14} style={{ color: "var(--muted)" }} />
            <input
              type="text"
              placeholder="Search..."
              className="bg-transparent outline-none text-sm w-full"
              style={{ color: "var(--foreground)" }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  setMobileMenuOpen(false);
                  handleSearch((e.target as HTMLInputElement).value);
                }
              }}
            />
          </div>
          <nav className="flex flex-col gap-1">
            {[
              { href: "/", label: "Home" },
              { href: "/explore", label: "Explore" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
                style={{ color: "var(--foreground)" }}>
                {item.label}
              </Link>
            ))}
            {isAuthenticated && (
              <Link
                href="/create"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors"
                style={{ color: "var(--foreground)" }}>
                Create Post
              </Link>
            )}
            {isAuthenticated && (
              <button
                onClick={() => { setMobileMenuOpen(false); setCreateCommunityOpen(true); }}
                className="px-3 py-2 rounded-lg text-sm hover:bg-white/5 transition-colors text-left"
                style={{ color: "var(--foreground)" }}>
                Create Community
              </button>
            )}
          </nav>
        </div>
      )}

      <CreateCommunityModal isOpen={createCommunityOpen} onClose={() => setCreateCommunityOpen(false)} />
    </header>
  );
}
