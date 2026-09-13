"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Camera, Check, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { Orientation } from "@/lib/types";
import { useToast } from "@/components/ui/ToastProvider";
import { usePrototype } from "@/lib/hooks/usePrototype";
import { useAuth } from "@/lib/hooks/useAuth";
import { updateProfile as updateProfileApi } from "@/lib/auth/client";
import { uploadMedia } from "@/lib/api/storage";
import { validateUsername } from "@/lib/utils/username";
import { cn } from "@/lib/utils/cn";

const ORIENTATIONS: { value: Orientation; label: string }[] = [
  { value: "straight", label: "Straight" },
  { value: "gay", label: "Gay" },
  { value: "lesbian", label: "Lesbian" },
  { value: "bisexual", label: "Bisexual" },
  { value: "trans", label: "Trans" },
  { value: "pansexual", label: "Pansexual" },
  { value: "asexual", label: "Asexual" },
  { value: "queer", label: "Queer" },
];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function defaultBirthDate(age?: number): { day: string; month: string; year: string } {
  const now = new Date();
  const year = now.getFullYear() - (age ?? 24);
  return { day: "15", month: "6", year: String(year) };
}

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

function calculateAge(day: number, month: number, year: number): number {
  const today = new Date();
  const birth = new Date(year, month - 1, day);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function readImageFile(file: File, onLoad: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === "string") onLoad(reader.result);
  };
  reader.readAsDataURL(file);
}

export function EditProfileContent() {
  const { getCurrentUser, updateProfile } = usePrototype();
  const { isAuthenticated, refresh } = useAuth();
  const user = getCurrentUser();
  const initialDob = defaultBirthDate(user.age);
  const { showToast } = useToast();

  const initialUsername = user.username ?? "";
  const initialDisplayName = user.displayName;
  const initialBio = user.bio ?? "";
  const initialOrientation = user.orientation ?? "";
  const initialAvatar = user.avatar;
  const initialCover = user.cover ?? "";

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [orientation, setOrientation] = useState<Orientation | "">(initialOrientation);
  const [avatar, setAvatar] = useState(initialAvatar);
  const [cover, setCover] = useState(initialCover);
  const [day, setDay] = useState(initialDob.day);
  const [month, setMonth] = useState(initialDob.month);
  const [year, setYear] = useState(initialDob.year);
  const [dobError, setDobError] = useState("");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const years = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 80 }, (_, i) => currentYear - 18 - i);
  }, []);

  const maxDays = useMemo(() => {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (!m || !y) return 31;
    return getDaysInMonth(m, y);
  }, [month, year]);

  const usernameValidation = useMemo(
    () => validateUsername(username, initialUsername),
    [username, initialUsername]
  );

  const usernameValid = usernameValidation.valid;
  const usernameError = !usernameValidation.valid ? usernameValidation.error : "";

  const validateDob = (d: string, m: string, y: string): boolean => {
    const dayNum = parseInt(d, 10);
    const monthNum = parseInt(m, 10);
    const yearNum = parseInt(y, 10);

    if (!dayNum || !monthNum || !yearNum) {
      setDobError("Please enter your full date of birth");
      return false;
    }

    const age = calculateAge(dayNum, monthNum, yearNum);
    if (age < 18) {
      setDobError("You must be at least 18 years old");
      return false;
    }

    setDobError("");
    return true;
  };

  const hasChanges = useMemo(() => {
    const age = calculateAge(parseInt(day, 10), parseInt(month, 10), parseInt(year, 10));
    const initialAge = user.age ?? calculateAge(
      parseInt(initialDob.day, 10),
      parseInt(initialDob.month, 10),
      parseInt(initialDob.year, 10)
    );

    return (
      displayName.trim() !== initialDisplayName ||
      username.trim().toLowerCase() !== initialUsername.toLowerCase() ||
      bio.trim() !== initialBio ||
      (orientation || "") !== initialOrientation ||
      avatar !== initialAvatar ||
      cover !== initialCover ||
      age !== initialAge
    );
  }, [
    displayName, username, bio, orientation, avatar, cover, day, month, year,
    initialDisplayName, initialUsername, initialBio, initialOrientation, initialAvatar, initialCover,
    user.age, initialDob,
  ]);

  const canSave = hasChanges && usernameValid && !dobError && displayName.trim().length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    if (!displayName.trim()) {
      showToast("Display name is required");
      return;
    }
    if (!validateDob(day, month, year)) return;

    const age = calculateAge(parseInt(day, 10), parseInt(month, 10), parseInt(year, 10));
    const payload = {
      displayName: displayName.trim(),
      username: username.trim().toLowerCase() || undefined,
      bio: bio.trim() || undefined,
      orientation: orientation || undefined,
      age,
      avatar,
      cover: cover || undefined,
    };
    setSaving(true);
    try {
      let avatarUrl = avatar;
      let coverUrl = cover || undefined;
      if (isAuthenticated && avatarFile) {
        const up = await uploadMedia(avatarFile, "avatar");
        avatarUrl = up.media.url ?? avatarUrl;
      }
      if (isAuthenticated && coverFile) {
        const up = await uploadMedia(coverFile, "cover");
        coverUrl = up.media.url ?? coverUrl;
      }

      if (isAuthenticated) {
        await updateProfileApi({
          displayName: payload.displayName,
          username: payload.username,
          bio: payload.bio,
          avatar: avatarUrl,
          cover: coverUrl,
        });
        await refresh();
        updateProfile({ ...payload, avatar: avatarUrl, cover: coverUrl });
      } else {
        updateProfile({ ...payload, avatar: avatarUrl, cover: coverUrl });
      }
      setAvatarFile(null);
      setCoverFile(null);
      showToast("Profile updated");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Could not save to server");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      showToast("Please select an image file");
      return;
    }
    readImageFile(file, setAvatar);
    setAvatarFile(file);
    e.target.value = "";
  };

  const handleCoverPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) {
      showToast("Please select an image file");
      return;
    }
    readImageFile(file, setCover);
    setCoverFile(file);
    e.target.value = "";
  };

  const inputClass =
    "w-full px-3 py-2.5 rounded-xl bg-surface border border-border text-sm outline-none focus:border-text-muted transition-colors";

  const showUsernameStatus = username.length > 0 || initialUsername.length > 0;

  return (
    <div className="min-h-dvh pb-8">
      <div className="sticky top-0 z-30 bg-bg/90 backdrop-blur-sm border-b border-border safe-top">
        <div className="flex items-center justify-between gap-3 px-4 h-14 max-w-2xl mx-auto">
          <div className="flex items-center gap-3">
            <Link href="/settings/" className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors" aria-label="Back to settings">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-lg font-semibold">Edit profile</h1>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm font-semibold transition-opacity",
              canSave ? "bg-text text-bg" : "bg-surface text-text-muted opacity-50 cursor-not-allowed"
            )}
          >
            Save
          </button>
        </div>
      </div>

      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverPick} />

      <div className="max-w-2xl mx-auto">
        <div className="relative h-32 sm:h-40 bg-surface">
          {cover && (
            <Image src={cover} alt="Cover" fill className="object-cover" sizes="100vw" unoptimized={cover.startsWith("data:")} />
          )}
          <button
            type="button"
            className="absolute bottom-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-nav text-xs font-medium"
            onClick={() => coverInputRef.current?.click()}
          >
            <Camera className="w-4 h-4" />
            Change cover
          </button>
        </div>

        <div className="px-4 -mt-10 mb-6">
          <div className="relative inline-block">
            <Avatar src={avatar} alt={displayName} size="xl" className="border-4 border-bg" />
            <button
              type="button"
              className="absolute bottom-1 right-1 p-1.5 rounded-full glass-nav"
              onClick={() => avatarInputRef.current?.click()}
              aria-label="Change profile photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="px-4 space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-xs font-medium text-text-muted mb-1.5">
              Display name
            </label>
            <input
              id="displayName"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className={inputClass}
              maxLength={50}
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-xs font-medium text-text-muted mb-1.5">
              Username
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">@</span>
              <input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/\s/g, "").toLowerCase())}
                className={cn(inputClass, "pl-7 pr-10")}
                maxLength={32}
              />
              {showUsernameStatus && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2">
                  {usernameValid ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <X className="w-4 h-4 text-like" />
                  )}
                </span>
              )}
            </div>
            {usernameError && <p className="text-xs text-like mt-1.5">{usernameError}</p>}
            <p className="text-xs text-text-muted mt-1.5 leading-relaxed">
              You can use characters 0-9, a-z, and underscore. Minimum length is 4 characters. Leave empty if you prefer no username.
            </p>
          </div>

          <div>
            <label htmlFor="bio" className="block text-xs font-medium text-text-muted mb-1.5">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={160}
              className={cn(inputClass, "resize-none")}
              placeholder="Tell people about yourself"
            />
            <p className="text-xs text-text-muted mt-1 text-right">{bio.length}/160</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-text-muted mb-1.5">Date of birth</label>
            <div className="grid grid-cols-3 gap-2">
              <select
                value={day}
                onChange={(e) => {
                  setDay(e.target.value);
                  validateDob(e.target.value, month, year);
                }}
                className={inputClass}
                aria-label="Day"
              >
                <option value="">Day</option>
                {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d)}>{d}</option>
                ))}
              </select>
              <select
                value={month}
                onChange={(e) => {
                  setMonth(e.target.value);
                  validateDob(day, e.target.value, year);
                }}
                className={inputClass}
                aria-label="Month"
              >
                <option value="">Month</option>
                {MONTHS.map((name, i) => (
                  <option key={name} value={String(i + 1)}>{name}</option>
                ))}
              </select>
              <select
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  validateDob(day, month, e.target.value);
                }}
                className={inputClass}
                aria-label="Year"
              >
                <option value="">Year</option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
            {dobError && <p className="text-xs text-like mt-1.5">{dobError}</p>}
          </div>

          <div>
            <label htmlFor="orientation" className="block text-xs font-medium text-text-muted mb-1.5">
              Orientation
            </label>
            <select
              id="orientation"
              value={orientation}
              onChange={(e) => setOrientation(e.target.value as Orientation | "")}
              className={inputClass}
            >
              <option value="">Prefer not to say</option>
              {ORIENTATIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
