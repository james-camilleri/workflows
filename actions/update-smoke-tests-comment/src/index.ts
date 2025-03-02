import * as core from '@actions/core'
import * as github from '@actions/github'

enum COMMENT_TYPE {
  TESTS_PASSED = 'tests-passed',
  TESTS_FAILED = 'tests-failed',
  SCREENSHOTS_UPDATED = 'screenshots-updated',
}

const COMMENT_TEMPLATES = {
  [COMMENT_TYPE.TESTS_PASSED]: `### ✔ Smoke Tests Passed\r\nSmoke tests passing successfully.`,
  [COMMENT_TYPE.TESTS_FAILED]: `### ❌ Smoke Tests Failed\r\nSmoke tests for the previous run have failed. Review the differences [here]({{test_artifact_url}}).\r\nIf these changes were expected, tick the checkbox below to automatically regenerate the baseline screenshots.\r\n- [ ] 📸 Regenerate screenshots`,
  [COMMENT_TYPE.SCREENSHOTS_UPDATED]: `### ❌ Smoke Tests Failed\r\nSmoke tests for the previous run have failed. Review the differences [here]({{test_artifact_url}}).\r\nBaseline screenshots have been regenerated: [\`{{commit_sha}}\`]({{commit_url}}).`,
}

function testCommentText(text?: string) {
  const regex = new RegExp(`### (✔|❌) Smoke Tests (Passed|Failed)\\r\\n`)
  return !!text && regex.test(text)
}

function generateCommentBody(type: COMMENT_TYPE, replace: Record<string, string>) {
  const template = COMMENT_TEMPLATES[type]
  return Object.entries(replace).reduce(
    (acc, [key, value]) => acc.replace(new RegExp(`{{${key}}}`, 'g'), value),
    template,
  )
}

async function run() {
  try {
    const token = core.getInput('repo-token', { required: true })
    const prNumber = Number.parseInt(core.getInput('pull-request', { required: true }), 10)
    const commentType = core.getInput('comment-type', { required: true }) as COMMENT_TYPE
    const artifactUrl = core.getInput('artifact-url')
    const commitSha = core.getInput('commit-sha')

    const octokit = github.getOctokit(token)

    const { payload } = github.context
    const { repository } = payload

    if (!prNumber || !repository) {
      core.info(`prNumber: ${JSON.stringify(prNumber)}`)
      core.info(`repository: ${JSON.stringify(repository)}`)
      core.info(`github.context: ${JSON.stringify(github.context)}`)

      throw Error('Missing PR details.')
    }

    const { name, owner } = repository

    const issue = {
      repo: name,
      owner: owner.login,
      issue_number: prNumber,
    }

    const allComments = await octokit.rest.issues.listComments(issue)
    const previousComment = allComments.data.find(({ body }) => testCommentText(body))

    if (previousComment) {
      await octokit.rest.issues.deleteComment({
        ...issue,
        comment_id: previousComment.id,
      })
    }

    await octokit.rest.issues.createComment({
      ...issue,
      body: generateCommentBody(commentType, {
        test_artifact_url: artifactUrl,
        commit_sha: commitSha.slice(0, 7),
        commit_url: `https://github.com/${owner.login}/${name}/commit/${commitSha}`,
      }),
    })
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run().catch(core.error)
