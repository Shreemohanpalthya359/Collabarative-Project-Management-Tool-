import React, { useState } from "react";
import API from "../services/api";

function CreateProject() {

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createProject = () => {

    API.post("/projects", {
      name,
      description
    }).then(() => {
      alert("Project created");
    });

  };

  return (
    <div>

      <h3>Create Project</h3>

      <input
        placeholder="Project Name"
        onChange={(e) => setName(e.target.value)}
      />

      <input
        placeholder="Description"
        onChange={(e) => setDescription(e.target.value)}
      />

      <button onClick={createProject}>
        Create
      </button>

    </div>
  );
}

export default CreateProject;