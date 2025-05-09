import fs from "fs-extra";
import os from "os";
import path from "path";

const workflowDir = path.join(os.homedir(), ".termpal", "workflows");
const workflowFile = path.join(workflowDir, "current.sh");

export async function getAgentResponse(prompt: string): Promise<string> {
  // Simple rule-based agent for prototype
  let script = "";
  let response = "";

  if (/kubernetes|deploy/i.test(prompt)) {
    script = "#!/bin/bash\nkubectl apply -f manifest.yaml";
    response = "Generated script to deploy manifest.yaml to Kubernetes.";
  } else if (/git.*branch/i.test(prompt)) {
    script = `#!/bin/bash
git pull origin main
git checkout -b new-branch
git add .
git commit -m "Your commit message"
git push origin new-branch`;
    response = "Generated git workflow script.";
  } else if (/hello/i.test(prompt)) {
    response = "Hello! How can I help you today?";
  } else {
    script = `#!/bin/bash\necho "Sorry, I don't know how to do that yet."`;
    response = "Sorry, I don't know how to do that yet.";
  }

  if (script) {
    fs.ensureDirSync(workflowDir);
    fs.writeFileSync(workflowFile, script);
  }

  return response;
}
