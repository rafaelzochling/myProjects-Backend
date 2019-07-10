const express = require("express");
const authMiddleware = require("../middlewares/auth");
const Project = require("../models/Project");
const Task = require("../models/Task");

const router = express.Router();

router.get("/", authMiddleware, async (req, res) => {
  try {
    const projects = await Project.find().populate([
      "user",
      "tasks",
      "assignedTo"
    ]);

    res.send({ projects });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ error: "Server Error During Projects Loading" });
  }
});

router.get("/tasks", authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find().populate("assignedTo");

    res.send({ tasks });
  } catch (err) {
    console.error(err);
    return res.status(500).send({ error: "Server Error During Tasks Loading" });
  }
});

router.get("/:projectId", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId).populate([
      "user",
      "tasks",
      "assignedTo"
    ]);

    res.send({ project });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ error: "Server Error During Project by ID Listing" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, description, tasks } = req.body;
    const project = await Project.create({
      title,
      description,
      user: req.userId
    });

    await Promise.all(
      tasks.map(async task => {
        const projectTask = new Task({ ...task, project: project._id });

        await projectTask.save();
        project.tasks.push(projectTask);
      })
    );

    await project.save();

    return res.send({ project });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ error: "Server Error During Project Creation" });
  }
});

router.put("/:projectId", authMiddleware, async (req, res) => {
  try {
    const { title, description, tasks } = req.body;
    const project = await Project.findByIdAndUpdate(
      req.params.projectId,
      {
        title,
        description
      },
      { new: true }
    );

    project.tasks = [];
    await Task.remove({ project: project._id });

    await Promise.all(
      tasks.map(async task => {
        const projectTask = new Task({ ...task, project: project._id });

        await projectTask.save();
        project.tasks.push(projectTask);
      })
    );

    await project.save();

    return res.send({ project });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ error: "Server Error During Project Creation" });
  }
});

router.delete("/:projectId", authMiddleware, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    await Promise.all(
      project.tasks.map(async task => await Task.findByIdAndRemove(task._id))
    );
    await Project.findByIdAndRemove(req.params.projectId);

    res.send({ msg: "Project Deleted Successfully!" });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .send({ error: "Server Error During Project Deletion" });
  }
});

module.exports = router;
