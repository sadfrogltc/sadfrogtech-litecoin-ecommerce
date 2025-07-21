"use client";

import React from "react";
 
export default function OrderDateCell({ date }: { date: string }) {
  const formatted = new Date(date).toLocaleDateString();
  return <>{formatted}</>;
} 