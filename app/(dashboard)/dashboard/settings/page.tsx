"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import {
  Settings,
  User,
  Bell,
  CreditCard,
  AlertTriangle,
  LogOut,
  Trash2,
  X,
} from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  createdAt: string;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [notifications, setNotifications] = useState({
    dailyBriefing: true,
    watchlistAlerts: true,
    weeklyDigest: false,
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const meta = user.user_metadata;
        const name =
          (meta?.full_name as string) ||
          (meta?.name as string) ||
          user.email?.split("@")[0] ||
          "User";
        setProfile({
          name,
          email: user.email || "",
          createdAt: user.created_at,
        });
      }
    });
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
          <Settings className="w-6 h-6 text-brand-cyan" />
          Settings
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Manage your account, notifications, and preferences.
        </p>
      </div>

      {/* Profile Section */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-brand-cyan" />
          Profile
        </h2>
        <Card className="!p-6">
          {profile ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-brand-cyan/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-brand-cyan">
                    {profile.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-lg font-semibold text-slate-900">{profile.name}</p>
                  <p className="text-sm text-slate-500">{profile.email}</p>
                </div>
              </div>
              <div className="border-t border-slate-100 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Full Name
                    </p>
                    <p className="text-sm text-slate-900 mt-1">{profile.name}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Email Address
                    </p>
                    <p className="text-sm text-slate-900 mt-1">{profile.email}</p>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Account Created
                    </p>
                    <p className="text-sm text-slate-900 mt-1">
                      {new Date(profile.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="animate-pulse space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-200" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-slate-200 rounded" />
                  <div className="h-4 w-48 bg-slate-200 rounded" />
                </div>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Notification Preferences */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-brand-cyan" />
          Notification Preferences
        </h2>
        <Card className="!p-6">
          <div className="space-y-5">
            {[
              {
                key: "dailyBriefing" as const,
                label: "Daily Intelligence Briefing",
                desc: "Receive the daily briefing via email every morning at 6:00 AM CT",
              },
              {
                key: "watchlistAlerts" as const,
                label: "Watchlist Alerts",
                desc: "Get notified when tracked entities have new activity",
              },
              {
                key: "weeklyDigest" as const,
                label: "Weekly Digest",
                desc: "A summary of the week's most important intelligence",
              },
            ].map((item) => (
              <div key={item.key} className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                </div>
                <button
                  onClick={() =>
                    setNotifications((prev) => ({
                      ...prev,
                      [item.key]: !prev[item.key],
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications[item.key] ? "bg-brand-cyan" : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      notifications[item.key] ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* Subscription */}
      <section>
        <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <CreditCard className="w-4 h-4 text-brand-cyan" />
          Subscription
        </h2>
        <Card className="!p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-slate-900">Free Tier</p>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wider">
                  Current Plan
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Limited access to intelligence briefings and dashboard.
              </p>
            </div>
            <button className="px-4 py-2 text-sm font-medium text-brand-cyan border border-brand-cyan rounded-lg hover:bg-brand-cyan/5 transition-colors">
              Upgrade
            </button>
          </div>
        </Card>
      </section>

      {/* Danger Zone */}
      <section>
        <h2 className="text-sm font-semibold text-red-600 flex items-center gap-2 mb-4">
          <AlertTriangle className="w-4 h-4" />
          Danger Zone
        </h2>
        <Card className="!p-6 border-red-200">
          <div className="space-y-4">
            {/* Sign Out */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Sign Out</p>
                <p className="text-xs text-slate-500 mt-0.5">Sign out of your Signaic account</p>
              </div>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </form>
            </div>

            <div className="border-t border-slate-100" />

            {/* Delete Account */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-900">Delete Account</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Permanently delete your account and all associated data
                </p>
              </div>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete Account
              </button>
            </div>
          </div>
        </Card>
      </section>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-elevated">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Delete Account?</h3>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              This action cannot be undone. All your data, watchlists, and preferences will be
              permanently deleted.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete My Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
