interface Props {
  level: string;
}

export default function RiskBadge({ level }: Props) {
  const colors: Record<string, string> = {
    "Low Risk": "green",
    "Moderate Risk": "orange",
    "High Risk": "red",
    "Critical Risk": "darkred",
  };

  return (
    <div
      style={{
        padding: "8px 16px",
        borderRadius: "20px",
        background: colors[level] || "gray",
        color: "white",
        display: "inline-block",
        fontWeight: "bold"
      }}
    >
      {level}
    </div>
  );
}
