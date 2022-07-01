const fs = require("fs");
const axios = require("axios").default;
// writeFile function with filename, content and callback function

const getRepos = async () =>
  axios
    .get("https://api.github.com/users/szulerinio/repos")
    .then((res) => res.data);

const filterReposByTopic = (repos, topic) => {
  console.log(repos);

  return repos.filter((obj) =>
    obj?.topics.some((element) => element === topic)
  );
};

const branchReducer = (previousValue, currentValue) => {
  if (previousValue === "master" || currentValue === "master") {
    return "master";
  }
  if (previousValue === "main" || currentValue === "main") {
    return "main";
  }
  if (previousValue === "dev" || currentValue === "dev") {
    return "dev";
  }
  return currentValue;
};

const getMainBranches = async (filteredRepos) =>
  Promise.all(
    filteredRepos.map(async ({ name, url }) => {
      const branchList = await axios
        .get(`${url}/branches`)
        .then((response) => response.data)
        .then((array) => array.map((obj) => obj.name));
      const mainBranch = branchList.reduce(branchReducer);
      return { repo: name, branch: mainBranch };
    })
  );

const getReadme = async (branches) =>
  Promise.all(
    branches.map(async ({ repo, branch }) => {
      const readme = await axios
        .get(
          `https://raw.githubusercontent.com/Szulerinio/${repo}/${branch}/README.md`
        )
        .then((response) => response.data)
        .then((readmeData) => readmeData.split("#")[1].trim());
      return readme;
    })
  );

const getContentOfTopic = async (repos, topic) => {
  const filteredRepos = filterReposByTopic(repos, topic);
  const mainBranches = await getMainBranches(filteredRepos);
  const data = await getReadme(mainBranches);
  return data.map((readme) => {
    return { type: topic, readme: readme };
  });
};

const main = async () => {
  const repos = await getRepos();
  const data = await Promise.all(
    ["university-project", "key-project"].map(
      async (topic) => await getContentOfTopic(repos, topic)
    )
  );

  const jsonData = JSON.stringify(data.flat());

  console.log(
    "------------------------------------------------------------------------------------------------"
  );
  console.log(jsonData);
  fs.writeFile("./public/repos.json", jsonData, function (err) {
    if (err) throw err;
    console.log("File is created successfully.");
  });
};
main();
