"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="max-w-md text-center">
        <h2 className="mb-4 text-2xl font-bold">エラーが発生しました</h2>
        <p className="mb-4 text-gray-600">
          申し訳ございません。予期しないエラーが発生しました。
        </p>
        <button
          onClick={reset}
          className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
        >
          もう一度試す
        </button>
      </div>
    </div>
  );
}
