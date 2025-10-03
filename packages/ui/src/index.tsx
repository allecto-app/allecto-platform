import * as React from "react";

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = (props) => {
  return <button {...props} style={{padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd"}} />;
};
