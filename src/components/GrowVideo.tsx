export default function GrowVideo({ className }: { className?: string }) {
  return (
    <video
      className={className}
      src={`${import.meta.env.BASE_URL}grow.mp4`}
      autoPlay
      muted
      loop
      playsInline
      aria-hidden="true"
    />
  )
}
