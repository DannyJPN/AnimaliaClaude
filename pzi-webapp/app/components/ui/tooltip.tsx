import { ReactNode } from "react";

type TooltipProps = {
  content: string;
  children: ReactNode;
};

export function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="relative group inline-block">
      {children}
      <div
        role="tooltip"
        className="absolute left-1/2 top-full z-10 mt-[14px] -translate-x-1/2 
                  rounded-md bg-[#616161] bg-opacity-90 px-2.5 py-1 text-xs text-white 
                  opacity-0 group-hover:opacity-100 transition-all duration-300 
                  delay-150 ease-[cubic-bezier(0.4,0,0.2,1)] pointer-events-none 
                  whitespace-nowrap -translate-y-2 group-hover:translate-y-0"
      >
        {content}
      </div>
    </div>
  );
}