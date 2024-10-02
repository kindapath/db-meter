import React from "react";

import dynamic from "next/dynamic";

const DecibelMeter = dynamic(() => import("../components/DecibelMeter"), {
  ssr: false,
});

export default function Home() {
  return (
    <div>
      <DecibelMeter />
    </div>
  );
}
