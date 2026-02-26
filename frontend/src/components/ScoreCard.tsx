interface Props {
  title: string;
  value: any;
}

export default function ScoreCard({ title, value }: Props) {
  return (
    <div
      style={{
        padding: "20px",
        background: "#1e1e2f",
        borderRadius: "12px",
        color: "white",
        width: "200px",
        boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
      }}
    >
      <h4>{title}</h4>
      <h2>{value}</h2>
    </div>
  );
}
