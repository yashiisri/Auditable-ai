import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";

export default function MainLayout() {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Sidebar />

      <div
        style={{
          flex: 1,
          overflowY: "auto",
        }}
      >
        <Outlet />
      </div>
    </div>
  );
}

