module.exports = {
  apps: [
    {
      name: "mine-panel",
      script: "npm",
      args: "run start",
      env: {
        NODE_ENV: "production",
        PORT: 2001,
      },
    },
  ],
};
