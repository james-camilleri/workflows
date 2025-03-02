import * as core from '@actions/core'
import * as github from '@actions/github'

function extractCloudflarePreviewUrl(comment: string, name: string) {
  const cloudflarePreviewUrlRegex = new RegExp(`https:\/\/[a-zA-Z0-9-]+\.${name}\.pages\.dev`)
  const match = comment.match(cloudflarePreviewUrlRegex)

  return match && match[0]
}

async function run() {
  try {
    const token = core.getInput('repo-token', { required: true })
    const prNumber = Number.parseInt(core.getInput('pull-request', { required: true }), 10)

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
    const previewUrl = allComments.data
      .map(({ body }) => body && extractCloudflarePreviewUrl(body, name))
      .find((url) => url != null)

    if (previewUrl) {
      core.info(`Preview URL found: ${previewUrl}`)
      core.setOutput('url', previewUrl)
    } else {
      core.setFailed('No preview URL found.')
    }
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message)
    }
  }
}

run().catch(core.error)
