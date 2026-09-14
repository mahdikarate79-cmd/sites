"use client";

import Link from "next/link";
import { User } from "@/lib/types";
import { profileSlug } from "@/lib/utils/profileSlug";
import { cn } from "@/lib/utils/cn";

interface ProfileLinkProps {
  user: Pick<User, "id" | "username">;
  className?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

/** Client-side profile navigation — works with static export hosting */
export function profilePath(user: Pick<User, "id" | "username">): string {
  return `/profile/${profileSlug(user)}`;
}

export function ProfileLink({ user, className, children, onClick }: ProfileLinkProps) {
  return (
    <Link href={profilePath(user)} className={cn(className)} onClick={onClick}>
      {children}
    </Link>
  );
}
