"use client";

import Link from "next/link";
import { User } from "@/lib/types";
import { profileSlug } from "@/lib/utils/profileSlug";
import { cn } from "@/lib/utils/cn";

interface ProfileLinkProps {
  user: Pick<User, "id" | "username"> & { deleted?: boolean };
  className?: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

/** Client-side profile navigation — works with static export hosting */
export function profilePath(user: Pick<User, "id" | "username">): string {
  return `/profile/${profileSlug(user)}/`;
}

export function isDeletedProfileUser(user: Pick<User, "id" | "username"> & { deleted?: boolean }): boolean {
  return !!user.deleted || user.id === "deleted";
}

export function ProfileLink({ user, className, children, onClick }: ProfileLinkProps) {
  if (isDeletedProfileUser(user)) {
    return <span className={cn(className)}>{children}</span>;
  }
  return (
    <Link href={profilePath(user)} className={cn(className)} onClick={onClick}>
      {children}
    </Link>
  );
}
