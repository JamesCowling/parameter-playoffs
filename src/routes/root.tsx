import { Outlet } from "react-router-dom";

import Nav from "../components/Nav";

export default function Root() {
  return (
    <div className="bg-gray-300 shadow">
      <Nav />
      <div className="m-8">
        <Outlet />
      </div>
    </div>
  );
}
