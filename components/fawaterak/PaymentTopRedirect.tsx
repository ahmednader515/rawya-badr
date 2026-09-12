"use client";

import { useEffect } from "react";

type PaymentTopRedirectProps = {
  target: string;
};

export function PaymentTopRedirect({ target }: PaymentTopRedirectProps) {
  useEffect(() => {
    if (window.self !== window.top) {
      window.top!.location.replace(target);
    } else {
      window.location.replace(target);
    }
  }, [target]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center px-4">
      <p className="text-sm text-neutral-500">Redirecting…</p>
    </div>
  );
}
