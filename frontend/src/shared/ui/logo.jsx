/** Primary square with a white polygon outline, used as the app logo mark. */
export function LogoMark() {
  return (
    <span
      aria-hidden
      className="flex size-7 items-center justify-center rounded-[7px] bg-primary"
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="none">
        <path
          d="M3 6.5 8 3l5 2.5-1 7-6.5 1L3 6.5Z"
          stroke="white"
          strokeWidth="1.6"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  )
}
