const petals = [
  { left: "5%", top: "18%", delay: "0s", duration: "8s" },
  { left: "12%", top: "62%", delay: "1.4s", duration: "10s" },
  { left: "22%", top: "12%", delay: "2.2s", duration: "9s" },
  { left: "38%", top: "78%", delay: "0.8s", duration: "11s" },
  { left: "58%", top: "10%", delay: "1.8s", duration: "8.5s" },
  { left: "72%", top: "24%", delay: "0.4s", duration: "9.5s" },
  { left: "84%", top: "66%", delay: "2.6s", duration: "10.5s" },
  { left: "93%", top: "30%", delay: "1.1s", duration: "8s" },
];

export function SakuraPetals() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      <span className="bg-petal/20 absolute -top-16 -right-10 size-48 rounded-full blur-3xl" />
      <span className="bg-skyblue/20 absolute -bottom-20 -left-12 size-56 rounded-full blur-3xl" />
      {petals.map((petal) => (
        <span
          key={`${petal.left}-${petal.top}`}
          className="petal"
          style={{
            left: petal.left,
            top: petal.top,
            animationDelay: petal.delay,
            animationDuration: petal.duration,
          }}
        />
      ))}
    </div>
  );
}
