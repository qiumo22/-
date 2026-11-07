export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="bg-muted h-8 w-48 animate-pulse rounded" />
      <div className="space-y-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="bg-muted h-28 animate-pulse rounded-xl" />
        ))}
      </div>
    </div>
  );
}
