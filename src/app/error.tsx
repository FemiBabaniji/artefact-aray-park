"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        padding: 24,
      }}
    >
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 500 }}>
        Something went wrong
      </h2>
      <button
        onClick={reset}
        style={{
          padding: "8px 16px",
          border: "1px solid currentColor",
          borderRadius: 6,
          background: "transparent",
          cursor: "pointer",
        }}
      >
        Try again
      </button>
    </div>
  );
}
