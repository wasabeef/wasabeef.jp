"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <div className="max-w-md text-center">
            <h2 className="mb-4 text-2xl font-bold">
              システムエラーが発生しました
            </h2>
            <p className="mb-4 text-gray-600">
              申し訳ございません。システムに問題が発生しました。
            </p>
            <button
              onClick={reset}
              className="rounded bg-blue-500 px-4 py-2 text-white transition hover:bg-blue-600"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
