import * as core from '@actions/core'
import * as github from '@actions/github'

function run() {
  try {
    const checkboxText = core.getInput('checkbox-text', { required: true })

    const { changes, comment } = github.context.payload as {
      changes?: { body?: { from?: string } }
      comment?: { body?: string }
    }

    const previousBody = changes?.body?.from
    const currentBody = comment?.body

    if (typeof previousBody !== 'string' || typeof currentBody !== 'string') {
      core.info(`previous body: ${JSON.stringify(previousBody)}`)
      core.info(`new body: ${JSON.stringify(currentBody)}`)
      throw Error('Comment body missing.')
    }

    const commentRegex = new RegExp(`- \\[(.)\\] ${checkboxText}`)
    const previousCheckboxString = previousBody.match(commentRegex)
    const currentCheckboxString = currentBody.match(commentRegex)

    if (previousCheckboxString == null || currentCheckboxString == null) {
      core.info(`checkbox string (previous): ${previousCheckboxString?.toString()}`)
      core.info(`checkbox string (current): ${currentCheckboxString?.toString()}`)

      // This is not the comment we're looking for.
      return false
    }

    const newlyChecked = previousCheckboxString?.[1] !== 'x' && currentCheckboxString?.[1] === 'x'

    core.info(`Checkbox "${checkboxText}" value: ${newlyChecked ? '✅' : '⬛'}`)
    core.setOutput('checked', newlyChecked)
  } catch (err) {
    if (err instanceof Error) {
      core.setFailed(err.message)
    }
  }
}

run()
