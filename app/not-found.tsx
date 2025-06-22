import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import { ERROR_MESSAGES, NAV_MESSAGES, ICON_SIZES } from "@/lib/constants";

export const metadata: Metadata = {
  title: ERROR_MESSAGES.pageNotFound,
  description: ERROR_MESSAGES.searchNotFound,
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md space-y-6">
        {/* Error Code */}
        <div className="space-y-2">
          <h1 className="text-6xl font-bold text-gray-900">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700">
            {ERROR_MESSAGES.pageNotFound}
          </h2>
        </div>

        {/* Error Message */}
        <div className="space-y-2">
          <p className="text-gray-600">
            {ERROR_MESSAGES.searchNotFound}
          </p>
          <p className="text-sm text-gray-500">
            URLを確認するか、以下のボタンからホームページに戻ってください。
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild className="flex items-center gap-2">
            <Link href="/">
              <Home className={ICON_SIZES.small} />
              {NAV_MESSAGES.backToHome}
            </Link>
          </Button>
          <Button variant="outline" asChild className="flex items-center gap-2">
            <Link href="/blog">
              <ArrowLeft className={ICON_SIZES.small} />
              {NAV_MESSAGES.viewBlog}
            </Link>
          </Button>
        </div>

        {/* Additional Help */}
        <div className="pt-4 text-xs text-gray-400">
          <p>{ERROR_MESSAGES.contactAdmin}</p>
        </div>
      </div>
    </div>
  );
}
