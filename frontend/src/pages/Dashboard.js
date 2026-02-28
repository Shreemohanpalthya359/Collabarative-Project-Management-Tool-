import React from "react";
import ProjectList from "../components/ProjectList";
import CreateProject from "../components/CreateProject";

function Dashboard() {

  return (
    <div>

      <h2>Project Dashboard</h2>

      <CreateProject />

      <ProjectList />

    </div>
  );

}

export default Dashboard;