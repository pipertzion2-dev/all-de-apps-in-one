Copy workspace-verify-all.yml into .github/workflows/ to enable strict CI
(npm run verify:all). If git push is rejected for missing "workflow" OAuth scope,
use a personal access token with workflow scope, or add the file via the GitHub web UI.
