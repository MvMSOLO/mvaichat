import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl",
    "text-sm font-semibold tracking-tight",
    "ring-offset-background transition-all duration-150 ease-out",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "select-none cursor-pointer active:scale-[0.96]",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary text-primary-foreground",
          "shadow-[0_2px_8px_-2px_hsl(var(--primary)/0.45),inset_0_1px_0_hsla(0,0%,100%,0.15)]",
          "hover:brightness-110 hover:shadow-[0_4px_18px_-4px_hsl(var(--primary)/0.65)]",
        ].join(" "),
        destructive: [
          "bg-destructive text-destructive-foreground",
          "shadow-[0_2px_8px_-2px_hsl(var(--destructive)/0.4)]",
          "hover:brightness-110 hover:shadow-[0_4px_16px_-4px_hsl(var(--destructive)/0.55)]",
        ].join(" "),
        outline: [
          "border border-border/60 bg-background/50 text-foreground",
          "backdrop-blur-sm",
          "hover:bg-muted/50 hover:border-primary/30 hover:text-foreground",
        ].join(" "),
        secondary: [
          "bg-muted/70 text-foreground border border-border/40",
          "hover:bg-muted hover:border-border/60",
        ].join(" "),
        ghost: [
          "text-foreground/70",
          "hover:bg-muted/60 hover:text-foreground",
          "active:bg-muted/80",
        ].join(" "),
        glass: [
          "glass text-foreground border border-border/40",
          "hover:bg-primary/10 hover:border-primary/25 hover:text-foreground",
          "shadow-[var(--shadow-soft)]",
        ].join(" "),
        glow: [
          "bg-primary text-primary-foreground relative overflow-hidden",
          "shadow-[0_0_24px_-4px_hsl(var(--primary)/0.55),inset_0_1px_0_hsla(0,0%,100%,0.18)]",
          "hover:shadow-[0_0_40px_-4px_hsl(var(--primary)/0.8)] hover:brightness-110",
          "after:absolute after:inset-0 after:bg-gradient-to-r after:from-transparent after:via-white/15 after:to-transparent",
          "after:-translate-x-full hover:after:translate-x-full after:transition-transform after:duration-500",
        ].join(" "),
        ink: [
          "bg-ink text-ink-foreground",
          "shadow-[0_2px_8px_-2px_hsl(0,0%,0%,0.3),inset_0_1px_0_hsla(0,0%,100%,0.07)]",
          "hover:opacity-90 hover:shadow-[0_4px_16px_-4px_hsl(0,0%,0%,0.45)]",
        ].join(" "),
        link: "text-primary underline-offset-4 hover:underline p-0 h-auto active:scale-100 rounded-none",
      },
      size: {
        default: "h-9 px-4 py-2 text-sm [&_svg]:size-4",
        sm: "h-8 px-3 py-1.5 text-xs rounded-lg [&_svg]:size-3.5",
        lg: "h-11 px-6 py-2.5 text-sm rounded-2xl [&_svg]:size-4",
        xl: "h-12 px-8 py-3 text-base rounded-2xl [&_svg]:size-5",
        icon: "h-9 w-9 [&_svg]:size-4",
        "icon-sm": "h-8 w-8 rounded-lg [&_svg]:size-3.5",
        "icon-lg": "h-10 w-10 [&_svg]:size-5",
        "icon-xs": "h-7 w-7 rounded-lg [&_svg]:size-3",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(
          buttonVariants({ variant, size }),
          loading && "relative !text-transparent pointer-events-none",
          className,
        )}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center text-foreground">
            <span className="size-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
          </span>
        )}
        {children}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
