import React, { useEffect, useState } from "react";
import API from "../services/api";

function ProjectList() {

  const [projects, setProjects] = useState([]);

  useEffect(() => {

    API.get("/projects")
      .then(res => {
        setProjects(res.data);
      });

  }, []);

  return (
    <div>
      <h3>Projects</h3>

      {projects.map(project => (
        <div key={project.id}>
          <h4>{project.name}</h4>
          <p>{project.description}</p>
        </div>
      ))}
    </div>
  );
}

export default ProjectList;